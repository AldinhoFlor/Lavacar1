"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Tag, Droplets } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "../confirm-dialog";
import { parseValor, valorValido } from "../money";
import { formatBRL } from "@/lib/lavacar/format";
import {
  atualizarEmpresa,
  salvarServico,
  excluirServico,
  salvarCategoria,
  excluirCategoria,
} from "@/app/actions/lavacar";
import type {
  Categoria,
  Empresa,
  Servico,
  TipoMovimentacao,
} from "@/lib/lavacar/types";

export function AjustesView({
  empresa,
  servicos,
  categorias,
}: {
  empresa: Empresa;
  servicos: Servico[];
  categorias: Categoria[];
}) {
  return (
    <div className="space-y-6">
      <EmpresaSection empresa={empresa} />
      <ServicosSection empresaId={empresa.id} servicos={servicos} />
      <CategoriasSection empresaId={empresa.id} categorias={categorias} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Nome da empresa
// -----------------------------------------------------------------------------
function EmpresaSection({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const [nome, setNome] = useState(empresa.nome);
  const [pending, startTransition] = useTransition();
  const alterado = nome.trim() !== empresa.nome && nome.trim().length > 0;

  function salvar() {
    startTransition(async () => {
      const res = await atualizarEmpresa(empresa.id, nome.trim());
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Nome atualizado");
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Meu lava-rápido</h2>
      </div>
      <label htmlFor="aj-nome" className="mb-1 block text-xs font-medium text-muted">
        Nome
      </label>
      <div className="flex gap-2">
        <input
          id="aj-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="h-12 flex-1 rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={salvar}
          disabled={!alterado || pending}
          className="btn-brand h-12 rounded-xl px-5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "…" : "Salvar"}
        </button>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Serviços
// -----------------------------------------------------------------------------
function ServicosSection({
  empresaId,
  servicos,
}: {
  empresaId: string;
  servicos: Servico[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<Servico | null>(null);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState<Servico | null>(null);
  const [, startTransition] = useTransition();

  function toggleAtivo(s: Servico) {
    startTransition(async () => {
      const res = await salvarServico({
        id: s.id,
        empresaId,
        nome: s.nome,
        preco: s.preco,
        ativo: !s.ativo,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const res = await excluirServico(empresaId, excluindo.id);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(res.soft ? "Serviço desativado" : "Serviço excluído");
    setExcluindo(null);
    router.refresh();
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold">Serviços</h2>
        </div>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 text-sm font-medium text-fg transition active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="divide-y divide-border-soft">
        {servicos.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${
                  s.ativo ? "text-fg" : "text-muted line-through"
                }`}
              >
                {s.nome}
              </p>
              <p className="text-xs text-muted">{formatBRL(s.preco)}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleAtivo(s)}
              aria-label={s.ativo ? "Desativar serviço" : "Ativar serviço"}
              aria-pressed={s.ativo}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                s.ativo ? "bg-success" : "bg-surface-2"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  s.ativo ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setEditando(s)}
              aria-label="Editar serviço"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setExcluindo(s)}
              aria-label="Excluir serviço"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-danger/15 hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {servicos.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">Nenhum serviço.</p>
        )}
      </div>

      {(criando || editando) && (
        <ServicoModal
          empresaId={empresaId}
          servico={editando}
          onClose={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        title="Excluir serviço"
        message={
          excluindo
            ? `Remover "${excluindo.nome}"? Se já houver lavagens com ele, será apenas desativado.`
            : ""
        }
      />
    </section>
  );
}

function ServicoModal({
  empresaId,
  servico,
  onClose,
}: {
  empresaId: string;
  servico: Servico | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(servico?.nome ?? "");
  const [preco, setPreco] = useState(
    servico ? String(servico.preco).replace(".", ",") : ""
  );
  const [pending, startTransition] = useTransition();

  const precoNum = parseValor(preco);
  const podeSalvar = nome.trim().length > 0 && valorValido(precoNum);

  function salvar() {
    if (!podeSalvar) return;
    startTransition(async () => {
      const res = await salvarServico({
        id: servico?.id,
        empresaId,
        nome: nome.trim(),
        preco: precoNum,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(servico ? "Serviço atualizado" : "Serviço criado");
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title={servico ? "Editar serviço" : "Novo serviço"}>
      <div className="space-y-4">
        <div>
          <label htmlFor="sv-nome" className="mb-1 block text-xs font-medium text-muted">
            Nome
          </label>
          <input
            id="sv-nome"
            value={nome}
            autoFocus
            onChange={(e) => setNome(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="sv-preco" className="mb-1 block text-xs font-medium text-muted">
            Preço
          </label>
          <input
            id="sv-preco"
            inputMode="decimal"
            value={preco}
            placeholder="0,00"
            onChange={(e) => setPreco(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={!podeSalvar || pending}
          className="btn-brand h-12 w-full rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Categorias
// -----------------------------------------------------------------------------
function CategoriasSection({
  empresaId,
  categorias,
}: {
  empresaId: string;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [criandoTipo, setCriandoTipo] = useState<TipoMovimentacao | null>(null);
  const [excluindo, setExcluindo] = useState<Categoria | null>(null);

  const entradas = categorias.filter((c) => c.tipo === "entrada");
  const saidas = categorias.filter((c) => c.tipo === "saida");

  async function confirmarExclusao() {
    if (!excluindo) return;
    const res = await excluirCategoria(empresaId, excluindo.id);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Categoria excluída");
    setExcluindo(null);
    router.refresh();
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Categorias</h2>
      </div>

      <Grupo
        titulo="Entradas"
        cor="success"
        itens={entradas}
        onNova={() => setCriandoTipo("entrada")}
        onEditar={setEditando}
        onExcluir={setExcluindo}
      />
      <div className="my-3 h-px bg-border-soft" />
      <Grupo
        titulo="Saídas"
        cor="danger"
        itens={saidas}
        onNova={() => setCriandoTipo("saida")}
        onEditar={setEditando}
        onExcluir={setExcluindo}
      />

      {(criandoTipo || editando) && (
        <CategoriaModal
          empresaId={empresaId}
          categoria={editando}
          tipoInicial={editando?.tipo ?? criandoTipo ?? "saida"}
          onClose={() => {
            setCriandoTipo(null);
            setEditando(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        title="Excluir categoria"
        message={
          excluindo
            ? `Remover "${excluindo.nome}"? As movimentações antigas mantêm o nome registrado.`
            : ""
        }
      />
    </section>
  );
}

function Grupo({
  titulo,
  cor,
  itens,
  onNova,
  onEditar,
  onExcluir,
}: {
  titulo: string;
  cor: string;
  itens: Categoria[];
  onNova: () => void;
  onEditar: (c: Categoria) => void;
  onExcluir: (c: Categoria) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: `var(--color-${cor})` }}
        >
          {titulo}
        </p>
        <button
          type="button"
          onClick={onNova}
          className="flex items-center gap-1 text-xs font-medium text-brand transition hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {itens.map((c) => (
          <span
            key={c.id}
            className="group flex items-center gap-1 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1 text-sm"
          >
            <button
              type="button"
              onClick={() => onEditar(c)}
              className="font-medium text-fg"
            >
              {c.nome}
            </button>
            <button
              type="button"
              onClick={() => onExcluir(c)}
              aria-label={`Excluir ${c.nome}`}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-danger/15 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {itens.length === 0 && (
          <span className="text-xs text-muted">Nenhuma.</span>
        )}
      </div>
    </div>
  );
}

function CategoriaModal({
  empresaId,
  categoria,
  tipoInicial,
  onClose,
}: {
  empresaId: string;
  categoria: Categoria | null;
  tipoInicial: TipoMovimentacao;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [tipo, setTipo] = useState<TipoMovimentacao>(tipoInicial);
  const [pending, startTransition] = useTransition();

  function salvar() {
    if (!nome.trim()) return;
    startTransition(async () => {
      const res = await salvarCategoria({
        id: categoria?.id,
        empresaId,
        nome: nome.trim(),
        tipo,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(categoria ? "Categoria atualizada" : "Categoria criada");
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={categoria ? "Editar categoria" : "Nova categoria"}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["entrada", "saida"] as TipoMovimentacao[]).map((t) => {
            const ativo = t === tipo;
            const c = t === "entrada" ? "success" : "danger";
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={ativo}
                className="min-h-[44px] rounded-xl border text-sm font-semibold transition active:scale-[0.98]"
                style={
                  ativo
                    ? {
                        borderColor: `var(--color-${c})`,
                        background: `color-mix(in srgb, var(--color-${c}) 15%, transparent)`,
                        color: `var(--color-${c})`,
                      }
                    : undefined
                }
              >
                {t === "entrada" ? "Entrada" : "Saída"}
              </button>
            );
          })}
        </div>
        <div>
          <label htmlFor="cat-nome" className="mb-1 block text-xs font-medium text-muted">
            Nome
          </label>
          <input
            id="cat-nome"
            value={nome}
            autoFocus
            onChange={(e) => setNome(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={!nome.trim() || pending}
          className="btn-brand h-12 w-full rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
