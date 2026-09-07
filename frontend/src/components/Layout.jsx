import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSidebar from './RoleSidebar';
import AIAssistantModal from './AIAssistantModal';

export default function Layout() {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <RoleSidebar onOpenAi={() => setIsAiOpen(true)} />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ openAiAssistant: () => setIsAiOpen(true) }} />
      </main>

      {/* Global AI Assistant Floating Action Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 font-medium text-sm transition-all transform hover:scale-105 border border-white/20"
        title="Open PMIS AI Assistant"
      >
        <span className="text-xl">🤖</span>
        <span>AI Assistant</span>
      </button>

      <AIAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
}