import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, User } from '@/lib/models'

export interface DuplicateMatch {
  recordId: string
  similarityScore: number
  matchedFields: string[]
  record: any
}

export interface DuplicateGroup {
  records: DuplicateMatch[]
  confidence: 'high' | 'medium' | 'low'
  matchType: string
}

export class DuplicateDetectionService {
  /**
   * Find duplicate families based on various criteria
   */
  static async findDuplicateFamilies(criteria: {
    name?: string
    email?: string
    phone?: string
    personEmail?: string
    personPhone?: string
  }): Promise<DuplicateGroup[]> {
    await connectDB()

    const duplicateGroups: DuplicateGroup[] = []
    const processedIds = new Set<string>()

    // Build query based on criteria
    const query: any = {}

    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' }
    }

    if (criteria.email) {
      query.email = { $regex: criteria.email, $options: 'i' }
    }

    if (criteria.phone) {
      query.phone = { $regex: criteria.phone, $options: 'i' }
    }

    // Find families matching the criteria
    const familiesRaw = await Family.find(query).lean()
    const families = familiesRaw as any

    for (const family of families) {
      if (processedIds.has(family._id.toString())) continue

      const matches: DuplicateMatch[] = [{
        recordId: family._id.toString(),
        similarityScore: 1.0,
        matchedFields: [],
        record: family
      }]

      // Check for duplicates based on name similarity
      if (family.name) {
        const nameMatches = families.filter((f: any) => 
          f._id.toString() !== family._id.toString() &&
          !processedIds.has(f._id.toString()) &&
          this.calculateSimilarity(family.name, f.name) > 0.8
        )

        for (const match of nameMatches) {
          const similarity = this.calculateSimilarity(family.name, match.name)
          matches.push({
            recordId: match._id.toString(),
            similarityScore: similarity,
            matchedFields: ['name'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      // Check for duplicates based on email
      if (family.email) {
        const emailMatches = families.filter((f: any) =>
          f._id.toString() !== family._id.toString() &&
          !processedIds.has(f._id.toString()) &&
          f.email &&
          f.email.toLowerCase() === family.email.toLowerCase()
        )

        for (const match of emailMatches) {
          matches.push({
            recordId: match._id.toString(),
            similarityScore: 1.0,
            matchedFields: ['email'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      // Check for duplicates based on phone
      if (family.phone) {
        const normalizedPhone = this.normalizePhone(family.phone)
        const phoneMatches = families.filter((f: any) =>
          f._id.toString() !== family._id.toString() &&
          !processedIds.has(f._id.toString()) &&
          f.phone &&
          this.normalizePhone(f.phone) === normalizedPhone
        )

        for (const match of phoneMatches) {
          matches.push({
            recordId: match._id.toString(),
            similarityScore: 1.0,
            matchedFields: ['phone'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      // Check family members for email/phone matches
      if (criteria.personEmail || criteria.personPhone) {
        const familyMembersRaw = await FamilyMember.find({
          familyId: { $in: families.map((f: any) => f._id) }
        }).lean()
        const familyMembers = familyMembersRaw as any

        for (const member of familyMembers) {
          if (criteria.personEmail && member.email) {
            const memberEmailMatches = familyMembers.filter((m: any) =>
              m._id.toString() !== member._id.toString() &&
              m.email &&
              m.email.toLowerCase() === member.email.toLowerCase()
            )

            for (const match of memberEmailMatches) {
              const matchFamily = families.find((f: any) => f._id.toString() === match.familyId.toString())
              if (matchFamily && !processedIds.has(matchFamily._id.toString())) {
                matches.push({
                  recordId: matchFamily._id.toString(),
                  similarityScore: 1.0,
                  matchedFields: ['personEmail'],
                  record: matchFamily
                })
                processedIds.add(matchFamily._id.toString())
              }
            }
          }

          if (criteria.personPhone && member.phone) {
            const normalizedPhone = this.normalizePhone(member.phone)
            const memberPhoneMatches = familyMembers.filter((m: any) =>
              m._id.toString() !== member._id.toString() &&
              m.phone &&
              this.normalizePhone(m.phone) === normalizedPhone
            )

            for (const match of memberPhoneMatches) {
              const matchFamily = families.find((f: any) => f._id.toString() === match.familyId.toString())
              if (matchFamily && !processedIds.has(matchFamily._id.toString())) {
                matches.push({
                  recordId: matchFamily._id.toString(),
                  similarityScore: 1.0,
                  matchedFields: ['personPhone'],
                  record: matchFamily
                })
                processedIds.add(matchFamily._id.toString())
              }
            }
          }
        }
      }

      if (matches.length > 1) {
        const confidence = this.determineConfidence(matches)
        duplicateGroups.push({
          records: matches,
          confidence,
          matchType: this.getMatchType(matches)
        })
      }

      processedIds.add(family._id.toString())
    }

    return duplicateGroups
  }

  /**
   * Find duplicate family members
   */
  static async findDuplicateMembers(criteria: {
    name?: string
    email?: string
    phone?: string
  }): Promise<DuplicateGroup[]> {
    await connectDB()

    const duplicateGroups: DuplicateGroup[] = []
    const processedIds = new Set<string>()

    const query: any = {}

    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' }
    }

    if (criteria.email) {
      query.email = { $regex: criteria.email, $options: 'i' }
    }

    if (criteria.phone) {
      query.phone = { $regex: criteria.phone, $options: 'i' }
    }

    const membersRaw = await FamilyMember.find(query).lean()
    const members = membersRaw as any

    for (const member of members) {
      if (processedIds.has(member._id.toString())) continue

      const matches: DuplicateMatch[] = [{
        recordId: member._id.toString(),
        similarityScore: 1.0,
        matchedFields: [],
        record: member
      }]

      // Check name similarity
      if (member.name) {
        const nameMatches = members.filter((m: any) =>
          m._id.toString() !== member._id.toString() &&
          !processedIds.has(m._id.toString()) &&
          this.calculateSimilarity(member.name, m.name) > 0.8
        )

        for (const match of nameMatches) {
          const similarity = this.calculateSimilarity(member.name, match.name)
          matches.push({
            recordId: match._id.toString(),
            similarityScore: similarity,
            matchedFields: ['name'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      // Check exact email match
      if (member.email) {
        const emailMatches = members.filter((m: any) =>
          m._id.toString() !== member._id.toString() &&
          !processedIds.has(m._id.toString()) &&
          m.email &&
          m.email.toLowerCase() === member.email.toLowerCase()
        )

        for (const match of emailMatches) {
          matches.push({
            recordId: match._id.toString(),
            similarityScore: 1.0,
            matchedFields: ['email'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      // Check exact phone match
      if (member.phone) {
        const normalizedPhone = this.normalizePhone(member.phone)
        const phoneMatches = members.filter((m: any) =>
          m._id.toString() !== member._id.toString() &&
          !processedIds.has(m._id.toString()) &&
          m.phone &&
          this.normalizePhone(m.phone) === normalizedPhone
        )

        for (const match of phoneMatches) {
          matches.push({
            recordId: match._id.toString(),
            similarityScore: 1.0,
            matchedFields: ['phone'],
            record: match
          })
          processedIds.add(match._id.toString())
        }
      }

      if (matches.length > 1) {
        const confidence = this.determineConfidence(matches)
        duplicateGroups.push({
          records: matches,
          confidence,
          matchType: this.getMatchType(matches)
        })
      }

      processedIds.add(member._id.toString())
    }

    return duplicateGroups
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1.0

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(
      str1.toLowerCase(),
      str2.toLowerCase()
    )

    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Normalize phone number for comparison
   */
  private static normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /**
   * Determine confidence level based on matches
   */
  private static determineConfidence(matches: DuplicateMatch[]): 'high' | 'medium' | 'low' {
    const exactMatches = matches.filter(m => m.similarityScore === 1.0)
    const highSimilarityMatches = matches.filter(m => m.similarityScore >= 0.9)

    if (exactMatches.length > 1) return 'high'
    if (highSimilarityMatches.length > 1) return 'medium'
    return 'low'
  }

  /**
   * Get match type description
   */
  private static getMatchType(matches: DuplicateMatch[]): string {
    const allFields = matches.flatMap(m => m.matchedFields)
    const uniqueFields = [...new Set(allFields)]

    if (uniqueFields.includes('email')) return 'email'
    if (uniqueFields.includes('phone')) return 'phone'
    if (uniqueFields.includes('name')) return 'name'
    return 'multiple'
  }
}

