import { ReportShare, CustomReport, User, Role } from '@/lib/models'
import { connectDB } from '@/lib/database'
import mongoose from 'mongoose'
import crypto from 'crypto'

export class ReportShareService {
  /**
   * Share a report with a user
   */
  static async shareWithUser(
    reportId: string,
    sharedBy: string,
    sharedWith: string,
    permissions: any
  ): Promise<any> {
    await connectDB()

    // Check if already shared
    const existing = await ReportShare.findOne({
      reportId,
      sharedWith: new mongoose.Types.ObjectId(sharedWith),
      shareType: 'user',
      isActive: true,
    })

    if (existing) {
      existing.permissions = permissions
      await existing.save()
      return existing
    }

    const share = await ReportShare.create({
      reportId,
      sharedWith: new mongoose.Types.ObjectId(sharedWith),
      sharedBy: new mongoose.Types.ObjectId(sharedBy),
      permissions,
      shareType: 'user',
      isActive: true,
    })

    return share
  }

  /**
   * Share a report with a role
   */
  static async shareWithRole(
    reportId: string,
    sharedBy: string,
    roleId: string,
    permissions: any
  ): Promise<any> {
    await connectDB()

    const existing = await ReportShare.findOne({
      reportId,
      roleId: new mongoose.Types.ObjectId(roleId),
      shareType: 'role',
      isActive: true,
    })

    if (existing) {
      existing.permissions = permissions
      await existing.save()
      return existing
    }

    const share = await ReportShare.create({
      reportId,
      sharedBy: new mongoose.Types.ObjectId(sharedBy),
      permissions,
      shareType: 'role',
      roleId: new mongoose.Types.ObjectId(roleId),
      isActive: true,
    })

    return share
  }

  /**
   * Create a shareable link
   */
  static async createShareLink(
    reportId: string,
    sharedBy: string,
    options: {
      expiresAt?: Date
      password?: string
      maxAccessCount?: number
      ipWhitelist?: string[]
      allowedDomains?: string[]
    }
  ): Promise<any> {
    await connectDB()

    const token = crypto.randomBytes(32).toString('hex')
    const hashedPassword = options.password
      ? crypto.createHash('sha256').update(options.password).digest('hex')
      : undefined

    const share = await ReportShare.create({
      reportId,
      sharedBy: new mongoose.Types.ObjectId(sharedBy),
      shareType: 'link',
      shareLink: {
        token,
        expiresAt: options.expiresAt,
        password: hashedPassword,
        maxAccessCount: options.maxAccessCount,
        accessCount: 0,
      },
      restrictions: {
        ipWhitelist: options.ipWhitelist || [],
        allowedDomains: options.allowedDomains || [],
        requireAuth: false,
      },
      permissions: {
        view: true,
        edit: false,
        share: false,
        delete: false,
        export: true,
        schedule: false,
        comment: false,
      },
      isActive: true,
    })

    return {
      share,
      shareUrl: `/reports/shared/${token}`,
    }
  }

  /**
   * Check if user has permission to access report
   */
  static async checkPermission(
    reportId: string,
    userId: string,
    permission: 'view' | 'edit' | 'share' | 'delete' | 'export' | 'schedule' | 'comment'
  ): Promise<boolean> {
    await connectDB()

    // Check if user owns the report
    const report = await CustomReport.findById(reportId).select('userId').lean()
    if (report && (report.userId as any).toString() === userId) {
      return true // Owner has all permissions
    }

    // Get user's role
    const user = await User.findById(userId).select('role customRoleId').lean()
    if (!user) {
      return false
    }

    // Check user-specific shares
    const userShare = await ReportShare.findOne({
      reportId,
      sharedWith: new mongoose.Types.ObjectId(userId),
      shareType: 'user',
      isActive: true,
    })

    if (userShare && userShare.permissions[permission]) {
      return true
    }

    // Check role-based shares
    if (user.customRoleId || user.role) {
      const roleId = user.customRoleId || user.role
      const roleShare = await ReportShare.findOne({
        reportId,
        roleId: roleId ? new mongoose.Types.ObjectId(roleId.toString()) : undefined,
        shareType: 'role',
        isActive: true,
      })

      if (roleShare && roleShare.permissions[permission]) {
        return true
      }
    }

    // Check public shares
    const publicShare = await ReportShare.findOne({
      reportId,
      shareType: 'public',
      isActive: true,
    })

    if (publicShare && publicShare.permissions[permission]) {
      return true
    }

    return false
  }

  /**
   * Validate share link access
   */
  static async validateShareLink(
    token: string,
    password?: string,
    ipAddress?: string
  ): Promise<any> {
    await connectDB()

    const share = await ReportShare.findOne({
      'shareLink.token': token,
      isActive: true,
    })
      .populate('reportId', 'name description')
      .lean()

    if (!share) {
      throw new Error('Invalid or expired share link')
    }

    // Check expiration
    if (share.shareLink?.expiresAt && new Date(share.shareLink.expiresAt) < new Date()) {
      throw new Error('Share link has expired')
    }

    // Check access count
    if (
      share.shareLink?.maxAccessCount &&
      (share.shareLink.accessCount || 0) >= share.shareLink.maxAccessCount
    ) {
      throw new Error('Share link has reached maximum access count')
    }

    // Check password
    if (share.shareLink?.password) {
      if (!password) {
        throw new Error('Password required')
      }
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
      if (hashedPassword !== share.shareLink.password) {
        throw new Error('Invalid password')
      }
    }

    // Check IP whitelist
    if (share.restrictions?.ipWhitelist && share.restrictions.ipWhitelist.length > 0) {
      if (!ipAddress || !share.restrictions.ipWhitelist.includes(ipAddress)) {
        throw new Error('Access denied from this IP address')
      }
    }

    // Increment access count
    await ReportShare.updateOne(
      { _id: share._id },
      { $inc: { 'shareLink.accessCount': 1 } }
    )

    return share
  }

  /**
   * Get all shares for a report
   */
  static async getReportShares(reportId: string): Promise<any[]> {
    await connectDB()

    const shares = await ReportShare.find({ reportId, isActive: true })
      .populate('sharedWith', 'firstName lastName email')
      .populate('sharedBy', 'firstName lastName email')
      .populate('roleId', 'name displayName')
      .lean()

    return shares
  }

  /**
   * Revoke a share
   */
  static async revokeShare(
    shareId: string,
    revokedBy: string
  ): Promise<void> {
    await connectDB()

    await ReportShare.findByIdAndUpdate(shareId, {
      isActive: false,
      revokedAt: new Date(),
      revokedBy: new mongoose.Types.ObjectId(revokedBy),
    })
  }

  /**
   * Get all reports shared with a user
   */
  static async getSharedReports(userId: string): Promise<any[]> {
    await connectDB()

    const user = await User.findById(userId).select('role customRoleId').lean()
    const shares = await ReportShare.find({
      $or: [
        { sharedWith: new mongoose.Types.ObjectId(userId), shareType: 'user' },
        { shareType: 'role', roleId: user?.customRoleId || user?.role },
        { shareType: 'public' },
      ],
      isActive: true,
    })
      .populate('reportId')
      .lean()

    return shares.map((share: any) => ({
      report: share.reportId,
      permissions: share.permissions,
      sharedBy: share.sharedBy,
      shareType: share.shareType,
    }))
  }
}

