import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Apple,
  ArrowLeft,
  Clock3,
  Flame,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  QrCode,
  Receipt,
  Save,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
  Wallet,
  CreditCard,
  FileText,
  ChefHat,
  X,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import {
  createRecipe,
  createRecipeOption,
  subscribeToRecipeCategories,
  subscribeToRecipeGoals,
  subscribeToRecipeMealTypes,
  subscribeToRecipes,
  updateRecipe,
  recipeImageFileToDataUrl,
  validateRecipeImage,
  validateRecipeImageUrl,
} from "../services/recetasService";
import "../Styles/Home.css";
import "../Styles/NuevaReceta.css";

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
  { name: "Nutrición", icon: Apple, path: "/nutricion" },
  { name: "Configuración", icon: Settings, path: "/configuracion" },
  { name: "Cerrar sesión", icon: LogOut, path: "/" },
];

const defaultCategories = ["Desayuno", "Plato principal", "Ensalada", "Bebida", "Snack", "Sopa"];
const defaultMealTypes = ["Desayuno", "Almuerzo", "Cena", "Snack"];
const defaultGoals = ["Ganancia muscular", "Definición", "Pérdida de peso", "Mantenimiento"];

const emptyForm = () => ({
  nombre: "",
  descripcion: "",
  categoria: "",
  tipoComida: "",
  objetivo: "",
  porciones: "1",
  ingredientes: [{ nombre: "", cantidad: "", unidad: "g", caloriasPor100: "" }],
  pasos: [{ titulo: "", descripcion: "", minutos: "" }],
  imageUrl: "",
  imagePath: "",
});

const asFormData = (recipe) => ({
  ...emptyForm(),
  ...recipe,
  porciones: String(recipe.porciones || 1),
  ingredientes: recipe.ingredientes?.length
    ? recipe.ingredientes.map((ingredient) => ({
      ...ingredient,
      cantidad: String(ingredient.cantidad ?? ""),
      caloriasPor100: String(ingredient.caloriasPor100 ?? ""),
    }))
    : emptyForm().ingredientes,
  pasos: recipe.pasos?.length
    ? recipe.pasos.map((step) => ({ ...step, minutos: String(step.minutos ?? "") }))
    : emptyForm().pasos,
});

const optionDisplayNames = (options, recipeItems, field, fallbacks) => [...new Set([
  ...fallbacks,
  ...options.map((option) => option.nombre),
  ...recipeItems.map((recipe) => recipe[field]),
].filter(Boolean))].sort((first, second) => first.localeCompare(second, "es"));

const calculateIngredientCalories = (ingredient) => {
  const quantity = Number(ingredient.cantidad);
  const caloriesPer100 = Number(ingredient.caloriasPor100);
  return Number.isFinite(quantity) && Number.isFinite(caloriesPer100) && quantity > 0 && caloriesPer100 >= 0
    ? quantity * caloriesPer100 / 100
    : 0;
};

export default function NuevaReceta() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const imageInputRef = useRef(null);
  const loadedRecipeId = useRef("");
  const [formData, setFormData] = useState(emptyForm);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mealTypes, setMealTypes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [imageFileName, setImageFileName] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(Boolean(recipeId));
  const [recipeNotFound, setRecipeNotFound] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [optionDialog, setOptionDialog] = useState("");
  const [optionName, setOptionName] = useState("");
  const [optionError, setOptionError] = useState("");
  const [isSavingOption, setIsSavingOption] = useState(false);

  useEffect(() => {
    const reportLoadError = (source) => (loadError) => {
      console.error(`Error al cargar ${source}:`, loadError);
      setFormError(`No se pudieron cargar ${source}. Verifica tu conexión y los permisos de Firestore.`);
      setIsLoadingRecipe(false);
    };
    const unsubscribeRecipes = subscribeToRecipes((nextRecipes) => {
      setRecipes(nextRecipes);
      if (recipeId) {
        const foundRecipe = nextRecipes.find((recipe) => recipe.id === recipeId);
        if (foundRecipe) {
          if (loadedRecipeId.current !== recipeId) {
            loadedRecipeId.current = recipeId;
            setFormData(asFormData(foundRecipe));
          }
          setRecipeNotFound(false);
          setIsLoadingRecipe(false);
        } else {
          setRecipeNotFound(true);
          setIsLoadingRecipe(false);
        }
      }
    }, reportLoadError("la receta"));
    if (!recipeId) loadedRecipeId.current = "";
    const unsubscribeCategories = subscribeToRecipeCategories(setCategories, reportLoadError("las categorías"));
    const unsubscribeMeals = subscribeToRecipeMealTypes(setMealTypes, reportLoadError("los tipos de comida"));
    const unsubscribeGoals = subscribeToRecipeGoals(setGoals, reportLoadError("los objetivos nutricionales"));
    return () => {
      unsubscribeRecipes();
      unsubscribeCategories();
      unsubscribeMeals();
      unsubscribeGoals();
    };
  }, [recipeId]);

  const recipeCategories = useMemo(
    () => optionDisplayNames(categories, recipes, "categoria", defaultCategories),
    [categories, recipes],
  );
  const recipeMealTypes = useMemo(
    () => optionDisplayNames(mealTypes, recipes, "tipoComida", defaultMealTypes),
    [mealTypes, recipes],
  );
  const recipeGoals = useMemo(
    () => optionDisplayNames(goals, recipes, "objetivo", defaultGoals),
    [goals, recipes],
  );

  const preparationMinutes = formData.pasos.reduce((total, step) => total + (Number(step.minutos) || 0), 0);
  const totalCalories = formData.ingredientes.reduce((total, ingredient) => total + calculateIngredientCalories(ingredient), 0);
  const caloriesPerServing = Math.round(totalCalories / Math.max(1, Number(formData.porciones) || 1));
  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  };

  const updateIngredient = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      ingredientes: current.ingredientes.map((ingredient, itemIndex) => (
        itemIndex === index ? { ...ingredient, [field]: value } : ingredient
      )),
    }));
    setFormError("");
  };

  const updateStep = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      pasos: current.pasos.map((step, itemIndex) => (
        itemIndex === index ? { ...step, [field]: value } : step
      )),
    }));
    setFormError("");
  };

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";
    if (!selectedFile) return;
    const imageError = validateRecipeImage(selectedFile);
    if (imageError) {
      setFieldErrors((current) => ({ ...current, imagen: imageError }));
      return;
    }

    setIsReadingImage(true);
    setFieldErrors((current) => ({ ...current, imagen: "" }));
    setFormError("");
    try {
      const imageUrl = await recipeImageFileToDataUrl(selectedFile);
      setFormData((current) => ({ ...current, imageUrl }));
      setImageFileName(selectedFile.name);
      setImageLoadError(false);
    } catch (imageError) {
      console.error("Error al leer la imagen de la receta:", imageError);
      setFieldErrors((current) => ({ ...current, imagen: imageError.message || "No se pudo leer la imagen." }));
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((current) => ({ ...current, imageUrl: "", imagePath: "" }));
    setImageFileName("");
    setImageLoadError(false);
    setFieldErrors((current) => ({ ...current, imagen: "" }));
  };

  const handleCreateOption = async (event) => {
    event.preventDefault();
    const name = optionName.trim();
    if (!name) {
      setOptionError("Escribe un nombre para continuar.");
      return;
    }
    const availableOptions = {
      category: recipeCategories,
      mealType: recipeMealTypes,
      goal: recipeGoals,
    }[optionDialog] || [];
    if (availableOptions.some((option) => option.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setOptionError("Ya existe una opción con ese nombre.");
      return;
    }

    setIsSavingOption(true);
    setOptionError("");
    try {
      await createRecipeOption(optionDialog, name);
      const field = { category: "categoria", mealType: "tipoComida", goal: "objetivo" }[optionDialog];
      setFormData((current) => ({ ...current, [field]: name }));
      setOptionName("");
      setOptionDialog("");
    } catch (saveError) {
      console.error("Error al crear la opción de receta:", saveError);
      setOptionError("No se pudo guardar. Verifica la conexión y los permisos de Firestore.");
    } finally {
      setIsSavingOption(false);
    }
  };

  const validateForm = () => {
    const errors = {
      nombre: formData.nombre.trim() ? "" : "El nombre de la receta es obligatorio.",
      categoria: formData.categoria ? "" : "Selecciona una categoría.",
      tipoComida: formData.tipoComida ? "" : "Selecciona el tipo de comida.",
      objetivo: formData.objetivo ? "" : "Selecciona un objetivo nutricional.",
      porciones: Number(formData.porciones) > 0 ? "" : "Ingresa al menos una porción.",
      ingredientes: formData.ingredientes.length > 0
        && formData.ingredientes.every((ingredient) => (
          ingredient.nombre.trim()
          && Number(ingredient.cantidad) > 0
          && String(ingredient.caloriasPor100).trim() !== ""
          && Number.isFinite(Number(ingredient.caloriasPor100))
          && Number(ingredient.caloriasPor100) >= 0
        ))
        ? ""
        : "Completa cada ingrediente con nombre, cantidad y kcal por 100 g/ml.",
      pasos: formData.pasos.length > 0
        && formData.pasos.every((step) => step.titulo.trim() && step.descripcion.trim() && Number(step.minutos) > 0)
        ? ""
        : "Cada paso necesita nombre, instrucciones y minutos mayores que cero.",
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (isReadingImage) return;
    const imageError = validateRecipeImageUrl(formData.imageUrl);
    if (imageError) {
      setFieldErrors((current) => ({ ...current, imagen: imageError }));
      return;
    }
    if (!validateForm()) {
      setFormError("Revisa los campos señalados antes de guardar la receta.");
      return;
    }

    const recipe = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      categoria: formData.categoria,
      tipoComida: formData.tipoComida,
      objetivo: formData.objetivo,
      porciones: Number(formData.porciones),
      tiempoPreparacion: preparationMinutes,
      calorias: caloriesPerServing,
      caloriasTotales: Math.round(totalCalories),
      ingredientes: formData.ingredientes.map((ingredient) => ({
        nombre: ingredient.nombre.trim(),
        cantidad: Number(ingredient.cantidad),
        unidad: ingredient.unidad,
        caloriasPor100: Number(ingredient.caloriasPor100),
      })),
      pasos: formData.pasos.map((step) => ({
        titulo: step.titulo.trim(),
        descripcion: step.descripcion.trim(),
        minutos: Number(step.minutos),
      })),
      imageUrl: formData.imageUrl || "",
      imagePath: formData.imagePath || "",
    };

    setIsSaving(true);
    try {
      if (recipeId) {
        await updateRecipe(recipeId, recipe);
      } else {
        await createRecipe(recipe);
      }
      navigate("/nutricion", {
        state: { feedback: recipeId ? "Receta actualizada correctamente." : "Receta guardada correctamente." },
      });
    } catch (saveError) {
      console.error("Error al guardar la receta:", saveError);
      const messages = {
        "permission-denied": "Firebase rechazó el guardado. Verifica que tu usuario tenga rol de administrador.",
        unauthenticated: "Tu sesión de Firebase expiró. Inicia sesión nuevamente e inténtalo otra vez.",
        unavailable: "Firebase no está disponible. Revisa tu conexión e inténtalo nuevamente.",
      };
      setFormError(messages[saveError.code] || `No se pudo guardar la receta${saveError.code ? ` (${saveError.code})` : ""}. ${saveError.message || "Verifica la conexión e inténtalo de nuevo."}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (recipeNotFound) {
    return (
      <div className="app">
        <main className="main">
          <Encabezado title="Receta no encontrada" description="La receta que buscas no está disponible." />
          <section className="content recipeNotFound"><p>Es posible que se haya eliminado o que ya no tengas acceso.</p><button type="button" className="recipePrimaryButton" onClick={() => navigate("/nutricion")}>Volver a Nutrición</button></section>
        </main>
      </div>
    );
  }

  if (isLoadingRecipe) {
    return <div className="app"><main className="main"><Encabezado title="Cargando receta" description="Un momento, por favor." /><section className="content"><p className="recipeLoading">Cargando información de la receta...</p></section></main></div>;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logoContainer"><img src="/logo-port-gym.png" alt="Port Gym" className="logoImage" /></div>
        <nav className="menu" aria-label="Navegación principal">
          {menuItems.map(({ name, icon: Icon, path }) => (
            <button key={name} type="button" className={`menuItem ${path === "/nutricion" ? "activeMenu" : ""} ${name === "Cerrar sesión" ? "logoutMenuItem" : ""}`} onClick={() => navigate(path)}>
              <Icon size={18} strokeWidth={2} /><span>{name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Encabezado title={recipeId ? "Editar receta" : "Nueva receta"} description={recipeId ? "Actualiza los ingredientes, la preparación y la información nutricional." : "Crea una receta y calcula automáticamente su tiempo y calorías."} />
        <section className="content recipeFormContent">
          <button type="button" className="recipeBackButton" onClick={() => navigate("/nutricion")}><ArrowLeft size={17} /> Volver a recetas</button>

          {formError && <div className="recipeFormError" role="alert">{formError}</div>}

          <form className="recipeForm" onSubmit={handleSubmit} noValidate>
            <div className="recipeFormMain">
              <section className="recipeFormCard">
                <div className="recipeCardHeading"><span><ChefHat size={18} /></span><div><h2>Información de la receta</h2><p>Datos principales para organizar y mostrar la receta.</p></div></div>
                <div className="recipeFieldsGrid">
                  <label className="recipeField recipeFieldWide">Nombre de la receta <b>*</b>
                    <input name="nombre" value={formData.nombre} onChange={handleTextChange} placeholder="Ej. Ensalada de pollo" maxLength="100" />
                    {fieldErrors.nombre && <small className="recipeFieldError">{fieldErrors.nombre}</small>}
                  </label>
                  <label className="recipeField recipeFieldWide">Descripción
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleTextChange} placeholder="Breve descripción de la receta..." maxLength="400" rows="3" />
                  </label>
                  <label className="recipeField">Categoría <b>*</b>
                    <span className="recipeSelectWithAdd"><select name="categoria" value={formData.categoria} onChange={handleTextChange}><option value="">Seleccionar categoría</option>{recipeCategories.map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label="Crear categoría" title="Crear categoría" onClick={() => { setOptionDialog("category"); setOptionName(""); setOptionError(""); }}><Plus size={15} /></button></span>
                    {fieldErrors.categoria && <small className="recipeFieldError">{fieldErrors.categoria}</small>}
                  </label>
                  <label className="recipeField">Tipo de comida <b>*</b>
                    <span className="recipeSelectWithAdd"><select name="tipoComida" value={formData.tipoComida} onChange={handleTextChange}><option value="">Seleccionar tipo</option>{recipeMealTypes.map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label="Crear tipo de comida" title="Crear tipo de comida" onClick={() => { setOptionDialog("mealType"); setOptionName(""); setOptionError(""); }}><Plus size={15} /></button></span>
                    {fieldErrors.tipoComida && <small className="recipeFieldError">{fieldErrors.tipoComida}</small>}
                  </label>
                  <label className="recipeField">Objetivo nutricional <b>*</b>
                    <span className="recipeSelectWithAdd"><select name="objetivo" value={formData.objetivo} onChange={handleTextChange}><option value="">Seleccionar objetivo</option>{recipeGoals.map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label="Crear objetivo nutricional" title="Crear objetivo nutricional" onClick={() => { setOptionDialog("goal"); setOptionName(""); setOptionError(""); }}><Plus size={15} /></button></span>
                    {fieldErrors.objetivo && <small className="recipeFieldError">{fieldErrors.objetivo}</small>}
                  </label>
                  <label className="recipeField">Porciones <b>*</b>
                    <input type="number" name="porciones" min="1" step="1" value={formData.porciones} onChange={handleTextChange} />
                    {fieldErrors.porciones && <small className="recipeFieldError">{fieldErrors.porciones}</small>}
                  </label>
                </div>
              </section>

              <section className="recipeFormCard">
                <div className="recipeCardHeading"><span className="recipeIngredientIcon"><Apple size={18} /></span><div><h2>Ingredientes</h2><p>Ingresa el peso/volumen y las kcal indicadas por cada 100 g o ml.</p></div></div>
                <div className="recipeIngredientList">
                  {formData.ingredientes.map((ingredient, index) => (
                    <div className="recipeIngredientRow" key={`ingredient-${index}`}>
                      <label className="recipeField recipeIngredientName">Ingrediente<input value={ingredient.nombre} onChange={(event) => updateIngredient(index, "nombre", event.target.value)} placeholder="Ej. Pechuga de pollo" /></label>
                      <label className="recipeField">Cantidad<input type="number" min="0.1" step="any" value={ingredient.cantidad} onChange={(event) => updateIngredient(index, "cantidad", event.target.value)} placeholder="100" /></label>
                      <label className="recipeField">Unidad<select value={ingredient.unidad} onChange={(event) => updateIngredient(index, "unidad", event.target.value)}><option value="g">g</option><option value="ml">ml</option></select></label>
                      <label className="recipeField">kcal / 100 g/ml<input type="number" min="0" step="any" value={ingredient.caloriasPor100} onChange={(event) => updateIngredient(index, "caloriasPor100", event.target.value)} placeholder="165" /></label>
                      <span className="recipeIngredientCalories"><Flame size={14} /> {Math.round(calculateIngredientCalories(ingredient))} kcal</span>
                      <button type="button" className="recipeRemoveButton" aria-label={`Eliminar ingrediente ${index + 1}`} disabled={formData.ingredientes.length === 1} onClick={() => setFormData((current) => ({ ...current, ingredientes: current.ingredientes.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                {fieldErrors.ingredientes && <small className="recipeFieldError">{fieldErrors.ingredientes}</small>}
                <button type="button" className="recipeAddButton" onClick={() => setFormData((current) => ({ ...current, ingredientes: [...current.ingredientes, { nombre: "", cantidad: "", unidad: "g", caloriasPor100: "" }] }))}><Plus size={16} /> Agregar ingrediente</button>
              </section>

              <section className="recipeFormCard">
                <div className="recipeCardHeading"><span className="recipeStepsIcon"><Clock3 size={18} /></span><div><h2>Preparación</h2><p>El tiempo total se calcula sumando los minutos de cada paso.</p></div></div>
                <div className="recipeStepList">
                  {formData.pasos.map((step, index) => (
                    <article className="recipeStepRow" key={`step-${index}`}>
                      <div className="recipeStepNumber">{String(index + 1).padStart(2, "0")}</div>
                      <div className="recipeStepFields">
                        <label className="recipeField">Nombre del paso<input value={step.titulo} onChange={(event) => updateStep(index, "titulo", event.target.value)} placeholder={`Ej. ${index === 0 ? "Preparar los ingredientes" : "Continuar preparación"}`} /></label>
                        <label className="recipeField recipeFieldMinutes">Minutos<input type="number" min="1" step="1" value={step.minutos} onChange={(event) => updateStep(index, "minutos", event.target.value)} placeholder="5" /></label>
                        <label className="recipeField recipeFieldWide">Instrucciones<textarea value={step.descripcion} onChange={(event) => updateStep(index, "descripcion", event.target.value)} placeholder="Describe cómo realizar este paso..." rows="2" /></label>
                      </div>
                      <button type="button" className="recipeRemoveButton" aria-label={`Eliminar paso ${index + 1}`} disabled={formData.pasos.length === 1} onClick={() => setFormData((current) => ({ ...current, pasos: current.pasos.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={16} /></button>
                    </article>
                  ))}
                </div>
                {fieldErrors.pasos && <small className="recipeFieldError">{fieldErrors.pasos}</small>}
                <button type="button" className="recipeAddButton" onClick={() => setFormData((current) => ({ ...current, pasos: [...current.pasos, { titulo: "", descripcion: "", minutos: "" }] }))}><Plus size={16} /> Agregar paso</button>
              </section>
            </div>

            <aside className="recipeFormAside">
              <section className="recipeFormCard recipeSummaryCard">
                <div className="recipeCardHeading"><span><Flame size={18} /></span><div><h2>Resumen nutricional</h2><p>Cálculo automático</p></div></div>
                <div className="recipeSummaryMetric"><span><Clock3 size={18} /></span><div><small>Tiempo de preparación</small><strong>{preparationMinutes} <em>min</em></strong></div></div>
                <div className="recipeSummaryMetric recipeCaloriesMetric"><span><Flame size={18} /></span><div><small>Calorías por porción</small><strong>{caloriesPerServing} <em>kcal</em></strong><small className="recipeSummaryHint">{Math.round(totalCalories)} kcal totales ÷ {Number(formData.porciones) || 1} porciones</small></div></div>
                <p className="recipeCalculationNote">Las calorías se calculan con la cantidad de cada ingrediente y su valor por 100 g/ml.</p>
              </section>

              <section className="recipeFormCard recipePhotoCard">
                <div className="recipeCardHeading"><span><ImagePlus size={18} /></span><div><h2>Imagen de la receta</h2><p>JPG o PNG, máximo 700 KB.</p></div></div>
                <input ref={imageInputRef} className="recipeImageInput" type="file" accept="image/png,image/jpeg" onChange={handleImageChange} disabled={isReadingImage} />
                <button type="button" className={`recipeImageDrop ${formData.imageUrl && !imageLoadError ? "recipeImageHasPreview" : ""}`} onClick={() => imageInputRef.current?.click()}>
                  {formData.imageUrl && !imageLoadError ? <img src={formData.imageUrl} alt="Vista previa de la receta" onError={() => setImageLoadError(true)} /> : <><ImagePlus size={28} /><strong>{imageLoadError ? "No se pudo cargar la imagen" : "Haz clic para subir una imagen"}</strong><span>PNG o JPG, máximo 700 KB</span></>}
                </button>
                {fieldErrors.imagen && <small className="recipeFieldError">{fieldErrors.imagen}</small>}
                <small className="recipeImageHelp">{isReadingImage ? "Preparando imagen..." : imageFileName ? `${imageFileName} · Se guardará en recetas.imageUrl.` : "La imagen se guarda en Firestore como URL base64."}</small>
                {formData.imageUrl && <button type="button" className="recipeImageReplace" onClick={handleRemoveImage}><X size={14} /> Quitar imagen</button>}
              </section>
            </aside>

            <div className="recipeFormActions">
              <button type="button" className="recipeCancelButton" onClick={() => navigate("/nutricion")}><X size={16} /> Cancelar</button>
              <button type="submit" className="recipePrimaryButton" disabled={isSaving || isReadingImage}><Save size={17} /> {isSaving ? "Guardando..." : isReadingImage ? "Preparando imagen..." : recipeId ? "Guardar cambios" : "Guardar receta"}</button>
            </div>
          </form>
        </section>
      </main>

      {optionDialog && (
        <div className="recipeOptionBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSavingOption) setOptionDialog(""); }}>
          <form className="recipeOptionDialog" onSubmit={handleCreateOption} role="dialog" aria-modal="true" aria-labelledby="recipe-option-title">
            <button type="button" className="recipeOptionClose" aria-label="Cerrar" disabled={isSavingOption} onClick={() => setOptionDialog("")}><X size={18} /></button>
            <span className="recipeOptionIcon"><Plus size={20} /></span>
            <h2 id="recipe-option-title">{optionDialog === "category" ? "Nueva categoría" : optionDialog === "mealType" ? "Nuevo tipo de comida" : "Nuevo objetivo nutricional"}</h2>
            <p>Agrega una opción para seleccionarla en esta receta.</p>
            <label className="recipeField">Nombre<input autoFocus value={optionName} onChange={(event) => { setOptionName(event.target.value); setOptionError(""); }} maxLength="50" placeholder="Escribe un nombre" /></label>
            {optionError && <small className="recipeFieldError" role="alert">{optionError}</small>}
            <div className="recipeOptionActions"><button type="button" className="recipeCancelButton" disabled={isSavingOption} onClick={() => setOptionDialog("")}>Cancelar</button><button type="submit" className="recipePrimaryButton" disabled={isSavingOption}><Plus size={15} /> {isSavingOption ? "Guardando..." : "Crear opción"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
