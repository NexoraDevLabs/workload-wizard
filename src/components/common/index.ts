// Permission-related components and utilities
export { PermissionGate } from "./PermissionGate";
export { PermissionButton } from "./PermissionButton";
export { PermissionPageWrapper } from "./PermissionPageWrapper";
export { PermissionGatingExample } from "./PermissionGatingExample";

// Convenience components
export {
  UsersViewGate,
  UsersCreateGate,
  UsersEditGate,
  UsersDeleteGate,
  PermissionsManageGate,
} from "./PermissionGate";

export {
  UsersViewButton as CreateUserButton,
  UsersEditButton as EditUserButton,
  UsersDeleteButton as DeleteUserButton,
  PermissionsManageButton as ManagePermissionsButton,
} from "./PermissionButton";

export {
  UsersPageWrapper,
  AdminPageWrapper,
  SystemAdminPageWrapper,
} from "./PermissionPageWrapper";
