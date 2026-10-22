import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Calendar,
  Sparkles,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';

export const AnotacoesView: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useApp();

  const [newContent, setNewContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    addNote(newContent);
    setNewContent('');
    setSuccessMessage('Anotação registrada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingContent.trim()) return;
    updateNote(id, editingContent);
    setEditingNoteId(null);
    setEditingContent('');
    setSuccessMessage('Anotação corrigida com sucesso!');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const filteredNotes = notes.filter((n) =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <StickyNote className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Bloco de Anotações & Lembretes Operacionais
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Espaço para registrar recados, tarefas, observações de clientes ou lembretes diários com registro de data e hora.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Box de Criação de Anotação */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Nova Anotação</span>
          </label>
          <span className="text-[11px] text-slate-400">
            A data e o horário atual serão salvos automaticamente
          </span>
        </div>

        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            placeholder="Escreva aqui sua anotação, recado, lista de tarefas ou observação importante..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white focus:outline-hidden transition-all placeholder:text-slate-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              {newContent.length} caracteres digitados
            </span>

            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Concluir e Salvar Anotação</span>
            </button>
          </div>
        </form>
      </div>

      {/* Barra de Pesquisa e Contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar nas anotações..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          Total de anotações: <strong className="text-slate-800">{notes.length}</strong>
        </span>
      </div>

      {/* Lista de Anotações */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <StickyNote className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            {notes.length === 0 ? 'Nenhuma anotação criada ainda' : 'Nenhuma anotação encontrada'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {notes.length === 0
              ? 'Use o campo acima para criar sua primeira anotação com registro automático de data e hora.'
              : `Nenhum resultado para a pesquisa "${searchQuery}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all p-5 flex flex-col justify-between overflow-hidden"
              >
                {/* Lápis de Edição no Canto Superior Direito e Lixeira */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setNoteToDeleteId(null);
                          handleStartEdit(note);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar anotação"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNoteToDeleteId(noteToDeleteId === note.id ? null : note.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          noteToDeleteId === note.id
                            ? 'bg-rose-100 text-rose-700'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Banner de Confirmação Inline de Exclusão (100% funcional no iframe) */}
                {noteToDeleteId === note.id && !isEditing && (
                  <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                      Deseja apagar esta anotação?
                    </span>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setNoteToDeleteId(null)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteNote(note.id);
                          setNoteToDeleteId(null);
                          setSuccessMessage('Anotação apagada com sucesso!');
                          setTimeout(() => setSuccessMessage(null), 2500);
                        }}
                        className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sim, Apagar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Conteúdo da Anotação */}
                {isEditing ? (
                  <div className="space-y-3 pt-1">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-amber-300 rounded-xl focus:outline-hidden"
                      autoFocus
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          deleteNote(note.id);
                          setEditingNoteId(null);
                          setSuccessMessage('Anotação apagada com sucesso!');
                          setTimeout(() => setSuccessMessage(null), 2500);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Excluir esta anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar Correção
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pr-16">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {note.content}
                    </p>
                  </div>
                )}

                {/* Rodapé: Data e Hora de Criação e Atualização */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Criado em: <strong className="text-slate-600">{note.createdAt}</strong></span>
                  </div>

                  {note.updatedAt && (
                    <span className="text-[10px] text-indigo-500 font-medium">
                      ✏️ Editado em {note.updatedAt}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
