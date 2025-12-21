import { Project, User, Team, ProjectPermissions } from '../types';

/**
 * Permission Service
 *
 * Calculates user permissions for projects based on:
 * - User's role in the team (owner/admin/member/viewer)
 * - Project ownership
 * - Project collaborators
 * - Project visibility (private/team)
 */

export const permissionService = {
  /**
   * Calculate user's permissions for a project
   *
   * Permission Logic:
   * - Owner: Full control (view, edit, delete, manage collaborators)
   * - Collaborator: Can view and edit
   * - Team Admin: Can view and delete team-wide projects
   * - Team Member: Can view team-wide projects (read-only)
   * - Viewer Role: Read-only access
   * - Non-collaborator on private project: No access
   */
  getProjectPermissions(
    project: Project,
    user: User,
    team: Team
  ): ProjectPermissions {
    const isOwner = project.ownerId === user.id;
    const isCollaborator = project.collaborators.includes(user.id);
    const isTeamAdmin = user.role === 'owner' || user.role === 'admin';
    const isViewer = user.role === 'viewer';

    // Owner has all permissions
    if (isOwner) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageCollaborators: true,
        userRole: 'owner'
      };
    }

    // Collaborators can view and edit (but not delete or manage collaborators)
    if (isCollaborator) {
      return {
        canView: true,
        canEdit: !isViewer, // Viewers in team can't edit even if collaborator
        canDelete: false, // Only owner can delete
        canManageCollaborators: false, // Only owner can manage
        userRole: 'collaborator'
      };
    }

    // For team-wide projects (not a collaborator)
    if (project.visibility === 'team') {
      return {
        canView: true, // All team members can view team-wide projects
        canEdit: false, // Must be collaborator to edit
        canDelete: isTeamAdmin, // Team admins can delete team-wide projects
        canManageCollaborators: false,
        userRole: 'viewer'
      };
    }

    // Private projects: no access if not owner or collaborator
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageCollaborators: false,
      userRole: 'viewer'
    };
  },

  /**
   * Check if user can perform a specific action on a project
   */
  canPerformAction(
    project: Project,
    user: User,
    team: Team,
    action: 'view' | 'edit' | 'delete' | 'manage_collaborators'
  ): boolean {
    const perms = this.getProjectPermissions(project, user, team);

    switch (action) {
      case 'view':
        return perms.canView;
      case 'edit':
        return perms.canEdit;
      case 'delete':
        return perms.canDelete;
      case 'manage_collaborators':
        return perms.canManageCollaborators;
      default:
        return false;
    }
  },

  /**
   * Get human-readable permission summary for UI display
   */
  getPermissionSummary(permissions: ProjectPermissions): string {
    if (permissions.userRole === 'owner') {
      return 'Owner - Full control';
    }
    if (permissions.canEdit) {
      return 'Collaborator - Can edit';
    }
    if (permissions.canView) {
      return 'Viewer - Read only';
    }
    return 'No access';
  }
};
