import { Dashboard, CustomReport, ReportSnapshot } from '@/lib/models'
import connectDB from '@/lib/database'

export class DashboardService {
  /**
   * Create a new dashboard
   */
  static async createDashboard(
    userId: string,
    name: string,
    description?: string,
    components?: any[],
    layout?: any
  ) {
    await connectDB()

    const dashboard = await Dashboard.create({
      userId,
      name,
      description,
      layout: layout || { type: 'grid', columns: 2, rows: 2 },
      components: components || [],
      isPublic: false,
      sharedWith: [],
      tags: [],
      isActive: true,
    })

    return dashboard
  }

  /**
   * Get all dashboards for a user
   */
  static async getDashboardsByUser(userId: string, includePublic: boolean = true) {
    await connectDB()

    const query: any = {
      $or: [
        { userId },
        ...(includePublic ? [{ isPublic: true }] : []),
        { sharedWith: userId },
      ],
      isActive: true,
    }

    const dashboards = await Dashboard.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .lean()

    return dashboards
  }

  /**
   * Get a specific dashboard by ID
   */
  static async getDashboardById(dashboardId: string, userId?: string) {
    await connectDB()

    const query: any = { _id: dashboardId, isActive: true }
    
    // If userId provided, check access
    if (userId) {
      query.$or = [
        { userId },
        { isPublic: true },
        { sharedWith: userId },
      ]
    }

    const dashboard = await Dashboard.findOne(query)
      .populate('userId', 'firstName lastName email')
      .populate('components.reportId', 'name description')
      .populate('components.snapshotId', 'name snapshotDate')
      .populate('sharedWith', 'firstName lastName email')
      .lean()

    return dashboard
  }

  /**
   * Update a dashboard
   */
  static async updateDashboard(
    dashboardId: string,
    userId: string,
    updates: {
      name?: string
      description?: string
      layout?: any
      components?: any[]
      isPublic?: boolean
      sharedWith?: string[]
      tags?: string[]
    }
  ) {
    await connectDB()

    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId })
    if (!dashboard) {
      throw new Error('Dashboard not found or access denied')
    }

    Object.assign(dashboard, updates)
    await dashboard.save()

    return dashboard
  }

  /**
   * Delete a dashboard
   */
  static async deleteDashboard(dashboardId: string, userId: string) {
    await connectDB()

    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId })
    if (!dashboard) {
      throw new Error('Dashboard not found or access denied')
    }

    dashboard.isActive = false
    await dashboard.save()

    return { success: true }
  }

  /**
   * Add a component to a dashboard
   */
  static async addComponent(
    dashboardId: string,
    userId: string,
    component: {
      reportId?: string
      snapshotId?: string
      title?: string
      chartType?: string
      position?: any
      filters?: any
      refreshInterval?: number
    }
  ) {
    await connectDB()

    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId })
    if (!dashboard) {
      throw new Error('Dashboard not found or access denied')
    }

    if (!component.reportId && !component.snapshotId) {
      throw new Error('Either reportId or snapshotId is required')
    }

    dashboard.components.push(component)
    await dashboard.save()

    return dashboard
  }

  /**
   * Remove a component from a dashboard
   */
  static async removeComponent(dashboardId: string, userId: string, componentIndex: number) {
    await connectDB()

    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId })
    if (!dashboard) {
      throw new Error('Dashboard not found or access denied')
    }

    if (componentIndex < 0 || componentIndex >= dashboard.components.length) {
      throw new Error('Invalid component index')
    }

    dashboard.components.splice(componentIndex, 1)
    await dashboard.save()

    return dashboard
  }

  /**
   * Share a dashboard with other users
   */
  static async shareDashboard(dashboardId: string, userId: string, sharedWith: string[]) {
    await connectDB()

    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId })
    if (!dashboard) {
      throw new Error('Dashboard not found or access denied')
    }

    dashboard.sharedWith = sharedWith
    await dashboard.save()

    return dashboard
  }

  /**
   * Get dashboard data with all component data populated
   */
  static async getDashboardData(dashboardId: string, userId?: string) {
    await connectDB()

    const dashboard = await this.getDashboardById(dashboardId, userId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // This would typically fetch the actual report data for each component
    // For now, we return the dashboard structure
    // The actual data fetching would be done by the report execution service

    return dashboard
  }
}

