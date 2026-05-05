import { redirect } from 'next/navigation';

/**
 * /account/profile has been consolidated into the Account Hub at /account.
 * The "Account details" tab contains all profile-management functionality.
 * Redirect permanently so any existing bookmarks or nav-user links continue to work.
 */
export default function ProfilePage() {
  redirect('/account');
}
