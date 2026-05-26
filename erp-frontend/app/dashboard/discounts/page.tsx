import Topbar from '../../../components/layout/Topbar';

export default function DiscountsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Discount Schemes" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">Discount Schemes</h2>
          <p className="dark:text-[#94a3b8] text-gray-600">Manage your percentage and flat discount schemes here.</p>
          <div className="mt-8 text-sm dark:text-[#475569] text-gray-500 border dark:border-[#1A1A1A] border-gray-300 dark:bg-[#0A0A0A] bg-white p-4 rounded-xl">
            This module is currently under construction.
          </div>
        </div>
      </main>
    </div>
  );
}
