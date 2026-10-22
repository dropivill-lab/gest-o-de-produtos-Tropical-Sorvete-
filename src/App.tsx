/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { EstoqueView } from './components/estoque/EstoqueView';
import { ProducaoView } from './components/producao/ProducaoView';
import { PedidosView } from './components/pedidos/PedidosView';
import { ClientesView } from './components/clientes/ClientesView';
import { FinanceiroView } from './components/financeiro/FinanceiroView';
import { ReceberView } from './components/receber/ReceberView';
import { RastreamentoView } from './components/rastreamento/RastreamentoView';
import { RelatoriosView } from './components/relatorios/RelatoriosView';
import { AlertasView } from './components/alertas/AlertasView';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { AnotacoesView } from './components/anotacoes/AnotacoesView';

const MainContent: React.FC = () => {
  const { activeView, setActiveView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const handleOpenNewOrder = () => {
    setActiveView('pedidos');
    setQuickOrderOpen(true);
  };

  const handleOpenNewProduction = () => {
    setActiveView('producao');
  };

  // Dedicated Full-Page View for Produção (as requested: "vai abrir uma outra página que vai ser da produção mesmo, aí vai ter o início, estoque, insumos, nota, configuração e sair")
  if (activeView === 'producao') {
    return <ProducaoView />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenNewOrder={handleOpenNewOrder}
            onOpenNewProduction={handleOpenNewProduction}
          />
        );
      case 'estoque':
        return <EstoqueView />;
      case 'producao':
        return <ProducaoView />;
      case 'pedidos':
        return (
          <PedidosView
            isModalOpenInitially={quickOrderOpen}
            onCloseInitialModal={() => setQuickOrderOpen(false)}
          />
        );
      case 'clientes':
        return <ClientesView />;
      case 'financeiro':
        return <FinanceiroView />;
      case 'receber':
        return <ReceberView />;
      case 'rastreamento':
        return <RastreamentoView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'alertas':
        return <AlertasView />;
      case 'anotacoes':
        return <AnotacoesView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      default:
        return (
          <DashboardView
            onOpenNewOrder={handleOpenNewOrder}
            onOpenNewProduction={handleOpenNewProduction}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewOrder={handleOpenNewOrder}
          onOpenNewProduction={handleOpenNewProduction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
