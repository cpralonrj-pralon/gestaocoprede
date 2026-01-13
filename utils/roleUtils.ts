
/**
 * Role utility functions for corporate business rules.
 */

/**
 * Checks if a given role is considered "operational" (i.e., not a Manager or Coordinator).
 * Operational roles are typically Analysts.
 * 
 * Business Rule: Roles starting with "GERENTE" or "COORDENADOR" are excluded from 
 * operational routines like Bank of Hours, Schedules, Vacations, etc.
 */
export const isOperationalRole = (role: string | undefined | null): boolean => {
    if (!role) return false;

    const normalizedRole = role.trim().toUpperCase();

    // Explicitly exclude Managers, Coordinators, and Admins
    if (normalizedRole.startsWith('GERENTE')) return false;
    if (normalizedRole.startsWith('COORDENADOR')) return false;
    if (normalizedRole.startsWith('GESTOR')) return false;
    if (normalizedRole.startsWith('SUPERVISOR')) return false;
    if (normalizedRole.startsWith('DIRETOR')) return false;
    if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR') return false;

    return true;
};
