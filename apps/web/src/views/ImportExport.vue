<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Importar / Exportar</h1>
      </div>
    </header>

    <!-- Importar -->
    <div class="section-title">Importar movimientos</div>

    <!-- Paso 0: Descargar template -->
    <div class="card step">
      <div class="step-num">1</div>
      <div class="step-body">
        <div class="step-label">Descargá la plantilla Excel</div>
        <div class="step-sub">Completá tus movimientos en el formato correcto antes de subir.</div>
        <a :href="templateUrl" download="plantilla-cuentitas.xlsx" class="btn-descarga">Descargar plantilla</a>
      </div>
    </div>

    <!-- Paso 1: Subir archivo -->
    <div class="card step" v-if="!preview">
      <div class="step-num">2</div>
      <div class="step-body">
        <div class="step-label">Subí tu archivo Excel</div>
        <div class="step-sub">Solo se procesan los datos — no se guarda nada todavía.</div>
        <label class="btn-upload" :class="{ loading: cargando }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          {{ cargando ? 'Procesando…' : 'Elegir archivo .xlsx' }}
          <input type="file" accept=".xlsx,.xls" @change="subirArchivo" :disabled="cargando" style="display:none" />
        </label>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="preview" class="card">
      <div class="card-header">
        <span class="card-title">Vista previa · {{ totalImportar }} para importar</span>
        <button class="btn-cancelar" @click="preview = null">Cancelar</button>
      </div>

      <div class="preview-stats">
        <div class="stat green"><span>{{ preview.validos.length }}</span>Válidos</div>
        <div class="stat amber" v-if="preview.sinCategoria?.length"><span>{{ preview.sinCategoria.length }}</span>Sin categoría</div>
        <div class="stat amber" v-if="preview.duplicados?.length"><span>{{ preview.duplicados.length }}</span>Duplicados</div>
        <div class="stat red" v-if="preview.errores?.length"><span>{{ preview.errores.length }}</span>Con error</div>
      </div>

      <!-- Lista válidos (truncada) -->
      <div class="preview-list" v-if="preview.validos.length">
        <div v-for="(m, i) in preview.validos.slice(0, 12)" :key="i" class="preview-row">
          <span class="pv-fecha">{{ m.fecha }}</span>
          <span class="pv-desc">{{ m.descripcion }}</span>
          <span class="pv-monto" :class="m.tipo === 'ingreso' ? 'green' : 'red'">{{ ars(m.monto) }}</span>
        </div>
        <div v-if="preview.validos.length > 12" class="preview-more">…y {{ preview.validos.length - 12 }} más</div>
      </div>

      <!-- Errores (max 5) -->
      <div v-if="preview.errores?.length" class="error-list">
        <div class="error-title">Filas con error</div>
        <div v-for="(e, i) in preview.errores.slice(0,5)" :key="i" class="error-row">{{ e.descripcion || e.fecha || 'Fila' }}: {{ e.error }}</div>
      </div>

      <button class="btn-confirmar" :disabled="confirmando" @click="confirmar">
        {{ confirmando ? 'Importando…' : 'Confirmar importación' }}
      </button>

      <div v-if="resultado" class="resultado" :class="resultado.ok ? 'ok' : 'err'">
        {{ resultado.msg }}
      </div>
    </div>

    <!-- Exportar -->
    <div class="section-title" style="margin-top:24px">Exportar</div>
    <div class="card">
      <div class="export-row">
        <div>
          <div class="step-label">Backup completo</div>
          <div class="step-sub">Todos tus movimientos en Excel (ordenados por fecha).</div>
        </div>
        <button class="btn-export" @click="exportar" :disabled="exportando">
          {{ exportando ? 'Generando…' : 'Exportar .xlsx' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { http } from '@/lib/http';
import { ars } from '@/lib/format';

const templateUrl = '/api/import/plantilla.xlsx';
const totalImportar = computed(() =>
  (preview.value?.validos.length ?? 0) + (preview.value?.sinCategoria?.length ?? 0),
);
const preview = ref<any>(null);
const cargando = ref(false);
const confirmando = ref(false);
const exportando = ref(false);
const resultado = ref<any>(null);

async function subirArchivo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  cargando.value = true;
  const fd = new FormData();
  fd.append('file', file);
  try {
    preview.value = await http.postForm<any>('/import', fd);
  } finally {
    cargando.value = false;
  }
}

async function confirmar() {
  confirmando.value = true;
  resultado.value = null;
  try {
    const items = [...preview.value.validos, ...(preview.value.sinCategoria ?? [])];
    const res = await http.post<any>('/import/confirmar', { items });
    resultado.value = { ok: true, msg: `Se importaron ${res.importados} movimientos.` };
    preview.value = null;
  } catch {
    resultado.value = { ok: false, msg: 'Ocurrió un error al importar.' };
  } finally {
    confirmando.value = false;
  }
}

async function exportar() {
  exportando.value = true;
  try {
    const resp = await fetch('/api/export.xlsx', { credentials: 'include' });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuentitas-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exportando.value = false;
  }
}
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { margin-bottom: 18px; }
.page-sub { font-size: 11px; color: var(--text-muted); }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: var(--text); }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--text); }

.step { display: flex; gap: 14px; align-items: flex-start; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none; margin-top: 2px; }
.step-body { flex: 1; }
.step-label { font-size: 13.5px; font-weight: 600; color: var(--text); }
.step-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; line-height: 1.4; }

.btn-descarga { display: inline-block; margin-top: 12px; background: var(--primary-soft); color: var(--primary); font-size: 12.5px; font-weight: 600; padding: 8px 16px; border-radius: 10px; text-decoration: none; }
.btn-upload { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; background: var(--primary); color: var(--surface); font-size: 12.5px; font-weight: 600; padding: 9px 16px; border-radius: 10px; cursor: pointer; }
.btn-upload.loading { opacity: .6; pointer-events: none; }
.btn-cancelar { font-size: 11.5px; color: var(--text-muted); background: none; border: none; cursor: pointer; }

.preview-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.stat { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.stat span { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
.stat.green { background: var(--income-soft); color: var(--income); }
.stat.amber { background: var(--warning-soft); color: var(--warning); }
.stat.red { background: var(--expense-soft); color: var(--expense); }

.preview-list { border-top: 1px solid var(--surface-3); padding-top: 10px; display: flex; flex-direction: column; gap: 9px; margin-bottom: 12px; }
.preview-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.pv-fecha { font-family: 'JetBrains Mono', monospace; color: var(--text-muted); min-width: 82px; }
.pv-desc { flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-monto { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.pv-monto.green { color: var(--income); }
.pv-monto.red { color: var(--expense); }
.preview-more { font-size: 11px; color: var(--text-muted); text-align: center; padding: 4px 0; }

.error-list { background: var(--expense-soft); border: 1px solid var(--expense-soft); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; }
.error-title { font-size: 12px; font-weight: 600; color: var(--expense); margin-bottom: 6px; }
.error-row { font-size: 11.5px; color: var(--text-soft); padding: 3px 0; }

.btn-confirmar { width: 100%; padding: 12px; background: var(--savings); color: var(--surface); border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
.btn-confirmar:disabled { opacity: .6; pointer-events: none; }

.resultado { margin-top: 12px; padding: 11px 14px; border-radius: 12px; font-size: 12.5px; font-weight: 500; }
.resultado.ok { background: var(--income-soft); color: var(--income); }
.resultado.err { background: var(--expense-soft); color: var(--expense); }

.export-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.btn-export { background: var(--text); color: var(--surface); border: none; border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; flex: none; }
.btn-export:disabled { opacity: .6; pointer-events: none; }
</style>
