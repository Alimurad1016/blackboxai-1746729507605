import React, { Suspense } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  TagIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  WrenchIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

// Navigation configuration
const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Brands', href: '/brands', icon: TagIcon },
  { name: 'Raw Materials', href: '/raw-materials', icon: CubeIcon },
  { name: 'Finished Products', href: '/finished-products', icon: ArchiveBoxIcon },
  { name: 'BOM', href: '/bom', icon: ClipboardDocumentListIcon },
  { name: 'Production', href: '/production', icon: WrenchIcon },
  { name: 'Inventory', href: '/inventory', icon: ChartBarIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
];

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Placeholder components (to be replaced with actual components later)
const Dashboard = () => (
  <div className="space-y-6">
    <h1 className="section-title">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Sample cards */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Total Brands</h3>
        <p className="text-3xl font-bold text-primary-600">12</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Raw Materials</h3>
        <p className="text-3xl font-bold text-primary-600">156</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Products</h3>
        <p className="text-3xl font-bold text-primary-600">89</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Production Today</h3>
        <p className="text-3xl font-bold text-primary-600">1,234</p>
      </div>
    </div>
  </div>
);

const PlaceholderPage = ({ title }) => (
  <div>
    <h1 className="section-title">{title}</h1>
    <div className="card">
      <p className="text-gray-500">Content for {title} will be implemented soon.</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Disclosure as="nav" className="bg-white shadow-sm">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div className="flex flex-shrink-0 items-center">
                    <span className="text-2xl font-display font-bold text-primary-600">
                      TrackIQ
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <button className="btn-primary">
                      <i className="fas fa-user mr-2"></i>
                      Sign In
                    </button>
                  </div>
                  <div className="flex items-center md:hidden ml-4">
                    <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>
            </div>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="md:hidden">
                <div className="space-y-1 pt-2 pb-3">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Disclosure.Button
                        key={item.name}
                        as={NavLink}
                        to={item.href}
                        className={({ isActive }) =>
                          `${
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } block pl-3 pr-4 py-2 text-base font-medium flex items-center`
                        }
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Disclosure.Button>
                    );
                  })}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Sidebar and Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/brands" element={<PlaceholderPage title="Brands" />} />
                <Route
                  path="/raw-materials"
                  element={<PlaceholderPage title="Raw Materials" />}
                />
                <Route
                  path="/finished-products"
                  element={<PlaceholderPage title="Finished Products" />}
                />
                <Route path="/bom" element={<PlaceholderPage title="BOM" />} />
                <Route
                  path="/production"
                  element={<PlaceholderPage title="Production" />}
                />
                <Route
                  path="/inventory"
                  element={<PlaceholderPage title="Inventory" />}
                />
                <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
