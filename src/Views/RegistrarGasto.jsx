import React, { useEffect, useMemo, useRef, useState } from "react";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Save,
  Plus,
  X,
  ImagePlus,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import {
  createExpense,
  createExpenseCategory,
  createExpenseProvider,
  subscribeToExpenseCategories,
  subscribeToExpenseProviders,
  subscribeToExpenses,
  validateExpenseReceipt,
} from "../services/gastosService";
import "../Styles/Home.css";
import "../Styles/RegistrarGasto.css";

const menuItems = [
  { name: "Inicio", icon: LayoutDashboard, path: "/home" },
  { name: "Asistencia", icon: QrCode, path: "/asistencia" },
  { name: "Clientes", icon: Users, path: "/clientes" },
  { name: "Membresías", icon: CreditCard, path: "/membresias" },
  { name: "Pagos", icon: Wallet, path: "/pagos" },
  { name: "Ventas", icon: ShoppingCart, path: "/ventas" },
  { name: "Inventario", icon: Package, path: "/inventario" },
  { name: "Gastos", icon: Receipt, path: "/gastos" },
  { name: "Análisis y estadísticas", icon: FileText, path: "/analisis" },
  { name: "Reportes", icon: FileText, path: "/reportes" },
  { name: "Nutrición", icon: FileText, path: "/nutricion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

export default function RegistrarGasto() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const receiptPreviewUrl = useRef("");
  const [optionDialog, setOptionDialog] = useState("");
  const [optionName, setOptionName] = useState("");
  const [optionError, setOptionError] = useState("");
  const [isSavingOption, setIsSavingOption] = useState(false);
  const [formData, setFormData] = useState({
    categoria: "",
    concepto: "",
    proveedor: "",
    monto: "",
    fecha: (() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    })(),
    estado: "Pendiente",
    metodo: "Efectivo",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleLoadError = (source, message) => (loadError) => {
      console.error(`Error al cargar ${source}:`, loadError);
      setError(message);
    };
    const unsubscribeExpenses = subscribeToExpenses(
      setExpenses,
      handleLoadError("los gastos", "No se pudieron cargar los gastos existentes."),
    );
    const unsubscribeCategories = subscribeToExpenseCategories(
      setCategories,
      handleLoadError("las categorías", "No se pudieron cargar las categorías guardadas."),
    );
    const unsubscribeProviders = subscribeToExpenseProviders(
      setProviders,
      handleLoadError("los proveedores", "No se pudieron cargar los proveedores guardados."),
    );
    return () => {
      unsubscribeExpenses();
      unsubscribeCategories();
      unsubscribeProviders();
    };
  }, []);

  useEffect(() => () => {
    if (receiptPreviewUrl.current) URL.revokeObjectURL(receiptPreviewUrl.current);
  }, []);

  const availableCategories = useMemo(() => [...new Set([
    ...categories.map((category) => category.nombre),
    ...expenses.map((expense) => expense.categoria),
  ].filter(Boolean))].sort((first, second) => first.localeCompare(second, "es")), [categories, expenses]);

  const availableProviders = useMemo(() => [...new Set(providers.map((provider) => provider.nombre).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, "es")), [providers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (receiptPreviewUrl.current) URL.revokeObjectURL(receiptPreviewUrl.current);
    receiptPreviewUrl.current = file ? URL.createObjectURL(file) : "";
    setReceiptPreview(receiptPreviewUrl.current);
    setReceiptFile(file);
    const receiptError = validateExpenseReceipt(file);
    setFieldErrors((current) => ({ ...current, comprobante: receiptError }));
    setError("");
  };

  const handleCreateOption = async (event) => {
    event.preventDefault();
    const name = optionName.trim();
    if (!name) {
      setOptionError("Escribe un nombre para continuar.");
      return;
    }
    const options = optionDialog === "category" ? availableCategories : availableProviders;
    if (options.some((option) => option.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setOptionError("Ya existe un registro con ese nombre.");
      return;
    }

    setIsSavingOption(true);
    setOptionError("");
    try {
      if (optionDialog === "category") {
        await createExpenseCategory(name);
        setFormData((current) => ({ ...current, categoria: name }));
      } else {
        await createExpenseProvider(name);
        setFormData((current) => ({ ...current, proveedor: name }));
      }
      setOptionDialog("");
      setOptionName("");
    } catch (saveError) {
      console.error("Error al guardar el registro del gasto:", saveError);
      setOptionError("No se pudo guardar. Verifica la conexión y los permisos de Firestore.");
    } finally {
      setIsSavingOption(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(formData.monto);
    const receiptError = validateExpenseReceipt(receiptFile);
    const validationErrors = {
      fecha: formData.fecha ? "" : "La fecha es obligatoria.",
      concepto: formData.concepto.trim() ? "" : "El concepto es obligatorio.",
      categoria: formData.categoria.trim() ? "" : "La categoría es obligatoria.",
      proveedor: formData.proveedor.trim() ? "" : "El proveedor es obligatorio.",
      monto: !formData.monto
        ? "El monto es obligatorio."
        : Number.isFinite(amount) && amount > 0 ? "" : "Ingresa un monto válido mayor que cero.",
      estado: formData.estado ? "" : "El estado es obligatorio.",
      metodo: formData.metodo ? "" : "El método de pago es obligatorio.",
      comprobante: receiptError,
    };
    setFieldErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) {
      setError("Revisa los campos obligatorios señalados.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const result = await createExpense({
        ...formData,
        categoria: formData.categoria.trim(),
        concepto: formData.concepto.trim(),
        proveedor: formData.proveedor.trim(),
        monto: amount,
        observaciones: formData.observaciones.trim(),
      }, receiptFile);
      navigate("/gastos", {
        state: {
          feedback: result.receiptUploaded
            ? "Gasto registrado correctamente."
            : "El gasto se guardó en Firebase, pero no se pudo subir el comprobante. Puedes intentar adjuntarlo nuevamente.",
          feedbackType: result.receiptUploaded ? "success" : "warning",
        },
      });
    } catch (saveError) {
      console.error("Error al registrar el gasto:", saveError);
      const saveErrorMessages = {
        "permission-denied": "Firebase rechazó el guardado por permisos. Verifica que tu usuario tenga rol de administrador y que las reglas de Firestore permitan escribir en gastos.",
        "unauthenticated": "Tu sesión de Firebase expiró. Inicia sesión nuevamente e inténtalo otra vez.",
        unavailable: "Firebase no está disponible en este momento. Revisa tu conexión e inténtalo nuevamente.",
        "resource-exhausted": "Firebase alcanzó un límite de escritura. Inténtalo nuevamente más tarde.",
      };
      const message = saveErrorMessages[saveError.code]
        || `No se pudo guardar el gasto en Firebase${saveError.code ? ` (${saveError.code})` : ""}. ${saveError.message || "Verifica la conexión y los permisos de Firestore."}`;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app">

      {/* =========================
          BARRA LATERAL
      ========================== */}
      <aside className="sidebar">

        {/* LOGO */}
        <div className="logoContainer">
          <img
            src="/logo-port-gym.png"
            alt="Port Gym"
            className="logoImage"
          />
        </div>

        {/* MENÚ */}
        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menuItem ${item.path === "/gastos" && ["/gastos", "/registrar-gasto"].includes(window.location.pathname) ? 'activeMenu' : ''} ${item.name === "Cerrar sesión" ? "logoutMenuItem" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* =========================
          ÁREA PRINCIPAL
      ========================== */}
      <main className="main">

        {/* ENCABEZADO SUPERIOR */}
        <Encabezado title="Registrar gasto" description="Agrega un nuevo gasto al sistema" />

        {/* =========================
            CONTENIDO REGISTRAR GASTO
        ========================== */}
        <section className="content">

          {/* BOTÓN VOLVER */}
          <button className="backButton" onClick={() => navigate("/gastos")}>
            <ArrowLeft size={18} />
            <span>Volver a gastos</span>
          </button>

          {/* FORMULARIO DE GASTO */}
          <div className="expenseFormContainer">
            <h3 className="formTitle">Información del gasto</h3>
            
            <form className="expenseForm" onSubmit={handleSubmit} noValidate>
              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-date">Fecha <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <input id="expense-date" type="date" name="fecha" className={`formInput ${fieldErrors.fecha ? "expenseFieldInvalid" : ""}`} value={formData.fecha} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.fecha)} aria-describedby={fieldErrors.fecha ? "expense-date-error" : undefined} />
                {fieldErrors.fecha && <span className="expenseFieldError" id="expense-date-error">{fieldErrors.fecha}</span>}
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-concept">Concepto <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <input
                  id="expense-concept"
                  type="text"
                  name="concepto"
                  className={`formInput ${fieldErrors.concepto ? "expenseFieldInvalid" : ""}`}
                  placeholder="Descripción del gasto"
                  value={formData.concepto}
                  onChange={handleChange}
                  required
                  maxLength="120"
                  aria-invalid={Boolean(fieldErrors.concepto)}
                  aria-describedby={fieldErrors.concepto ? "expense-concept-error" : undefined}
                />
                {fieldErrors.concepto && <span className="expenseFieldError" id="expense-concept-error">{fieldErrors.concepto}</span>}
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-category">Categoría <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <select id="expense-category" name="categoria" className={`formSelect ${fieldErrors.categoria ? "expenseFieldInvalid" : ""}`} value={formData.categoria} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.categoria)} aria-describedby={fieldErrors.categoria ? "expense-category-error" : undefined}>
                  <option value="">Seleccionar categoría</option>
                  {availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                {fieldErrors.categoria && <span className="expenseFieldError" id="expense-category-error">{fieldErrors.categoria}</span>}
                <button type="button" className="expenseOptionButton" onClick={() => { setOptionDialog("category"); setOptionName(""); setOptionError(""); }}>
                  <Plus size={15} /> Nueva categoría
                </button>
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-provider">Proveedor <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <select id="expense-provider" name="proveedor" className={`formSelect ${fieldErrors.proveedor ? "expenseFieldInvalid" : ""}`} value={formData.proveedor} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.proveedor)} aria-describedby={fieldErrors.proveedor ? "expense-provider-error" : undefined}>
                  <option value="">Seleccionar proveedor</option>
                  {availableProviders.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                </select>
                {fieldErrors.proveedor && <span className="expenseFieldError" id="expense-provider-error">{fieldErrors.proveedor}</span>}
                <button type="button" className="expenseOptionButton" onClick={() => { setOptionDialog("provider"); setOptionName(""); setOptionError(""); }}>
                  <Plus size={15} /> Nuevo proveedor
                </button>
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-amount">Monto <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <input id="expense-amount" type="number" name="monto" className={`formInput ${fieldErrors.monto ? "expenseFieldInvalid" : ""}`} placeholder="C$ 0.00" value={formData.monto} onChange={handleChange} min="0.01" step="0.01" required aria-invalid={Boolean(fieldErrors.monto)} aria-describedby={fieldErrors.monto ? "expense-amount-error" : undefined} />
                {fieldErrors.monto && <span className="expenseFieldError" id="expense-amount-error">{fieldErrors.monto}</span>}
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-status">Estado <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <select id="expense-status" name="estado" className={`formSelect ${fieldErrors.estado ? "expenseFieldInvalid" : ""}`} value={formData.estado} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.estado)} aria-describedby={fieldErrors.estado ? "expense-status-error" : undefined}>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
                {fieldErrors.estado && <span className="expenseFieldError" id="expense-status-error">{fieldErrors.estado}</span>}
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="expense-method">Método <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <select id="expense-method" name="metodo" className={`formSelect ${fieldErrors.metodo ? "expenseFieldInvalid" : ""}`} value={formData.metodo} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.metodo)} aria-describedby={fieldErrors.metodo ? "expense-method-error" : undefined}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
                {fieldErrors.metodo && <span className="expenseFieldError" id="expense-method-error">{fieldErrors.metodo}</span>}
              </div>

              <div className="expenseReceiptField">
                <label className="formLabel" htmlFor="expense-receipt">Imagen del comprobante <span className="expenseRequiredMark" aria-hidden="true">*</span></label>
                <label className="expenseReceiptUpload" htmlFor="expense-receipt">
                  <ImagePlus size={22} />
                  <span>{receiptFile ? receiptFile.name : "Seleccionar imagen JPG o PNG (máximo 5 MB)"}</span>
                  <input id="expense-receipt" type="file" accept="image/jpeg,image/png" onChange={handleReceiptChange} required aria-invalid={Boolean(fieldErrors.comprobante)} aria-describedby={fieldErrors.comprobante ? "expense-receipt-error" : undefined} />
                </label>
                {fieldErrors.comprobante && <span className="expenseFieldError" id="expense-receipt-error">{fieldErrors.comprobante}</span>}
                {receiptPreview && <img className="expenseReceiptPreview" src={receiptPreview} alt="Vista previa del comprobante" />}
              </div>

              <div className="formGroup expenseObservationsField">
                <label className="formLabel" htmlFor="expense-observations">Observaciones <span className="expenseOptionalLabel">(opcional)</span></label>
                <textarea id="expense-observations" name="observaciones" className="formInput expenseObservationsInput" value={formData.observaciones || ""} onChange={handleChange} maxLength="500" rows="3" placeholder="Agrega detalles adicionales si los necesitas" />
              </div>

              {error && <p className="expenseFormError" role="alert">{error}</p>}
              <div className="formActions">
                <button type="button" className="cancelButton" onClick={() => navigate("/gastos")}>
                  Cancelar
                </button>
                <button type="submit" className="saveButton" disabled={isSaving}>
                  <Save size={18} />
                  <span>{isSaving ? "Guardando..." : "Guardar gasto"}</span>
                </button>
              </div>
            </form>
          </div>

        </section>

      </main>

      {optionDialog && (
        <div className="expenseOptionOverlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSavingOption) setOptionDialog("");
        }}>
          <form className="expenseOptionDialog" onSubmit={handleCreateOption} role="dialog" aria-modal="true" aria-labelledby="expense-option-title">
            <div className="expenseOptionHeading">
              <div>
                <span>REGISTRO RÁPIDO</span>
                <h2 id="expense-option-title">{optionDialog === "category" ? "Nueva categoría" : "Nuevo proveedor"}</h2>
              </div>
              <button type="button" className="expenseOptionClose" onClick={() => setOptionDialog("")} aria-label="Cerrar" disabled={isSavingOption}><X size={19} /></button>
            </div>
            <label className="formLabel" htmlFor="expense-option-name">Nombre</label>
            <input id="expense-option-name" className="formInput" value={optionName} onChange={(event) => setOptionName(event.target.value)} maxLength="60" autoFocus required />
            {optionError && <p className="expenseFormError" role="alert">{optionError}</p>}
            <div className="expenseOptionActions">
              <button type="button" className="cancelButton" onClick={() => setOptionDialog("")} disabled={isSavingOption}>Cancelar</button>
              <button type="submit" className="saveButton" disabled={isSavingOption}><Save size={16} />{isSavingOption ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}