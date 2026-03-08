import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  ListTodo,
  History,
  CheckSquare,
  Users,
  Building2,
  Wallet,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { profile, signOut, canApprove, isAdmin } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['Faculty', 'DeptHead', 'Admin']
    },
    {
      name: 'New Request',
      icon: FilePlus,
      path: '/requests/new',
      roles: ['Faculty', 'DeptHead']
    },
    {
      name: 'My Requests',
      icon: ListTodo,
      path: '/requests',
      roles: ['Faculty', 'DeptHead']
    },
    {
      name: 'Request History',
      icon: History,
      path: '/history',
      roles: ['Faculty', 'DeptHead', 'Admin']
    },
    {
      name: 'Pending Approvals',
      icon: CheckSquare,
      path: '/approvals',
      roles: ['DeptHead', 'Admin']
    },
    {
      name: 'Budget',
      icon: Wallet,
      path: '/budget',
      roles: ['DeptHead', 'Admin']
    },
    {
      name: 'Users',
      icon: Users,
      path: '/users',
      roles: ['Admin']
    },
    {
      name: 'Suppliers',
      icon: Building2,
      path: '/vendors',
      roles: ['Admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-24 bottom-0 w-64 bg-red-900 text-white flex flex-col shadow-2xl z-10">
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-2 px-3">
          {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/requests'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? 'rounded-none bg-red-950 text-white font-semibold shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                        : 'rounded-lg text-red-100 hover:bg-red-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-red-700/50 bg-red-950">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-lg bg-red-900/50">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-red-700 shadow-sm">
            <span className="text-sm font-bold text-red-900">
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-white">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-red-200">{profile?.role || 'Guest'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-100 hover:bg-red-800 hover:text-white transition-all duration-200 border border-red-700/50 hover:border-red-600 hover:shadow-sm"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

