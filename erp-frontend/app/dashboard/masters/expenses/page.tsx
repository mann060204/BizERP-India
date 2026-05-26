import Topbar from '../../../../components/layout/Topbar';

export default function ExpenseMasterPage() {
  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Expense Master" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Expense Master</h2>
          <p className="text-[#94a3b8]">Manage expense categories and types.</p>
          <div className="mt-8 text-sm text-[#475569] border border-[#1A1A1A] bg-[#0A0A0A] p-4 rounded-xl">
            This module is currently under construction.
          </div>
        </div>
      </main>
    </div>
  );
}
