import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  ChefHat,
  CircleCheck,
  CircleX,
  Clock3,
  Download,
  Eye,
  Flame,
  Pencil,
  Plus,
  QrCode,
  Search,
  Utensils,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  LogOut,
} from "lucide-react";
import Encabezado from "../Components/Encabezado";
import { downloadRecipePdf } from "../services/recetaPdf";
import {
  subscribeToRecipeCategories,
  subscribeToRecipeGoals,
  subscribeToRecipeMealTypes,
  subscribeToRecipes,
  updateRecipeStatus,
} from "../services/recetasService";
import AdminSidebar from "../Components/AdminSidebar";
import "../Styles/Home.css";
import "../Styles/Nutricion.css";

const fallbackCategories = ["Desayuno", "Plato principal", "Ensalada", "Bebida", "Snack", "Sopa"];
const fallbackMealTypes = ["Desayuno", "Almuerzo", "Cena", "Snack"];
const fallbackGoals = ["Ganancia muscular", "Definición", "Pérdida de peso", "Mantenimiento"];

const optionNames = (options, recipes, field, fallbacks = []) => [...new Set([
  ...fallbacks,
  ...options.map((option) => option.nombre),
  ...recipes.map((recipe) => recipe[field]),
].filter(Boolean))].sort((first, second) => first.localeCompare(second, "es"));

const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase();

const recipeCalories = (recipe) => Math.round(Number(recipe.calorias) || 0);
const formatDate = (value) => {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

export default function Nutricion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mealTypes, setMealTypes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(location.state?.feedback || "");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mealFilter, setMealFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [downloadingId, setDownloadingId] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState("");

  useEffect(() => {
    const fail = (source) => (loadError) => {
      console.error(`Error al cargar ${source}:`, loadError);
      setError(`No se pudieron cargar ${source}. Verifica tu conexión y los permisos de Firestore.`);
      setIsLoading(false);
    };
    const unsubscribers = [
      subscribeToRecipes((nextRecipes) => {
        setRecipes(nextRecipes);
        setIsLoading(false);
        setError("");
      }, fail("las recetas")),
      subscribeToRecipeCategories(setCategories, fail("las categorías de recetas")),
      subscribeToRecipeMealTypes(setMealTypes, fail("los tipos de comida")),
      subscribeToRecipeGoals(setGoals, fail("los objetivos nutricionales")),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    if (!location.state?.feedback) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const availableCategories = useMemo(
    () => optionNames(categories, recipes, "categoria", fallbackCategories),
    [categories, recipes],
  );
  const availableMealTypes = useMemo(
    () => optionNames(mealTypes, recipes, "tipoComida", fallbackMealTypes),
    [mealTypes, recipes],
  );
  const availableGoals = useMemo(
    () => optionNames(goals, recipes, "objetivo", fallbackGoals),
    [goals, recipes],
  );

  const visibleRecipes = useMemo(() => recipes.filter((recipe) => {
    const query = normalize(search);
    const matchesSearch = normalize([
      recipe.nombre,
      recipe.descripcion,
      recipe.categoria,
      recipe.tipoComida,
      recipe.objetivo,
      ...(recipe.ingredientes || []).map((ingredient) => ingredient.nombre),
    ].join(" ")).includes(query);
    const matchesCategory = !categoryFilter || recipe.categoria === categoryFilter;
    const matchesMeal = !mealFilter || recipe.tipoComida === mealFilter;
    const matchesGoal = !goalFilter || recipe.objetivo === goalFilter;
    const matchesStatus = !statusFilter || (statusFilter === "active" ? recipe.activa !== false : recipe.activa === false);
    return matchesSearch && matchesCategory && matchesMeal && matchesGoal && matchesStatus;
  }).sort((first, second) => String(first.nombre).localeCompare(String(second.nombre), "es")), [
    recipes,
    search,
    categoryFilter,
    mealFilter,
    goalFilter,
    statusFilter,
  ]);

  const activeRecipes = recipes.filter((recipe) => recipe.activa !== false);
  const recentRecipes = [...recipes]
    .sort((first, second) => {
      const firstDate = first.creadoEn?.toDate?.()?.getTime?.() || 0;
      const secondDate = second.creadoEn?.toDate?.()?.getTime?.() || 0;
      return secondDate - firstDate;
    })
    .slice(0, 5);

  const handleDownload = async (recipe) => {
    setDownloadingId(recipe.id);
    setError("");
    try {
      await downloadRecipePdf(recipe);
    } catch (downloadError) {
      console.error("Error al generar el PDF de la receta:", downloadError);
      setError("No se pudo descargar el PDF. Inténtalo nuevamente.");
    } finally {
      setDownloadingId("");
    }
  };

  const handleStatusChange = async (recipe) => {
    setUpdatingStatusId(recipe.id);
    setError("");
    try {
      await updateRecipeStatus(recipe.id, recipe.activa === false);
    } catch (statusError) {
      console.error("Error al actualizar el estado de la receta:", statusError);
      setError("No se pudo actualizar el estado de la receta. Verifica los permisos de Firestore.");
    } finally {
      setUpdatingStatusId("");
    }
  };

  return (
    <div className="app">
      <AdminSidebar />

      <main className="main">
        <Encabezado title="Nutrición" description="Gestiona las recetas y planes nutricionales de la aplicación móvil." />
        <section className="content nutritionContent">
          <div className="nutritionTopActions">
            <p>Administra las recetas que verán los clientes en la aplicación móvil.</p>
            <button type="button" className="nutritionPrimaryButton" onClick={() => navigate("/nueva-receta")}>
              <Plus size={18} /> Nueva receta
            </button>
          </div>

          {feedback && <div className="nutritionFeedback" role="status">{feedback}<button type="button" aria-label="Cerrar mensaje" onClick={() => setFeedback("")}><X size={16} /></button></div>}
          {error && <div className="nutritionError" role="alert">{error}</div>}

          <div className="nutritionStats">
            <article className="nutritionStat nutritionStatGreen"><span className="nutritionStatIcon"><ChefHat size={19} /></span><span>Total de recetas</span><strong>{recipes.length}</strong><small>En el recetario</small></article>
            <article className="nutritionStat nutritionStatBlue"><span className="nutritionStatIcon"><Utensils size={19} /></span><span>Categorías</span><strong>{availableCategories.length}</strong><small>Opciones disponibles</small></article>
            <article className="nutritionStat nutritionStatGreen"><span className="nutritionStatIcon"><CircleCheck size={19} /></span><span>Recetas activas</span><strong>{activeRecipes.length}</strong><small>Visibles en la aplicación</small></article>
            <article className="nutritionStat nutritionStatRose"><span className="nutritionStatIcon"><CircleX size={19} /></span><span>Recetas desactivadas</span><strong>{recipes.length - activeRecipes.length}</strong><small>No visibles en la aplicación</small></article>
          </div>

          <section className="nutritionPanel">
            <div className="nutritionPanelHeading">
              <div className="nutritionHeadingIcon"><Apple size={21} /></div>
              <div><h3>Recetas</h3><p>Administra las recetas que verán los clientes en la aplicación móvil.</p></div>
            </div>
            <div className="nutritionFilters">
              <label>Categoría<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas</option>{availableCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Tipo de comida<select value={mealFilter} onChange={(event) => setMealFilter(event.target.value)}><option value="">Todos</option>{availableMealTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Objetivo<select value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)}><option value="">Todos</option>{availableGoals.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos</option><option value="active">Activas</option><option value="inactive">Desactivadas</option></select></label>
              <label className="nutritionSearch"><Search size={16} /><input type="search" placeholder="Buscar recetas o ingredientes..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            </div>
            <div className="nutritionTableWrap">
              <table className="nutritionTable">
                <thead><tr><th>#</th><th>Imagen</th><th>Nombre de la receta</th><th>Categoría</th><th>Tipo de comida</th><th>Objetivo</th><th>Tiempo</th><th>Calorías</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {isLoading && <tr><td colSpan="10" className="nutritionEmpty">Cargando recetas...</td></tr>}
                  {!isLoading && visibleRecipes.map((recipe, index) => (
                    <tr key={recipe.id}>
                      <td className="nutritionNumber">{String(index + 1).padStart(3, "0")}</td>
                      <td><div className="nutritionTableImage">{recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : <Apple size={19} />}</div></td>
                      <td className="nutritionRecipeName">{recipe.nombre}</td>
                      <td><span className="nutritionTag nutritionTagCategory">{recipe.categoria}</span></td>
                      <td>{recipe.tipoComida}</td>
                      <td><span className="nutritionTag nutritionTagGoal">{recipe.objetivo}</span></td>
                      <td>{Number(recipe.tiempoPreparacion) || 0} min</td>
                      <td>{recipeCalories(recipe)} kcal</td>
                      <td><div className="nutritionStatusCell"><button type="button" role="switch" aria-checked={recipe.activa !== false} aria-label={`${recipe.activa === false ? "Activar" : "Desactivar"} ${recipe.nombre}`} className={`nutritionStatusToggle ${recipe.activa === false ? "nutritionStatusToggleOff" : ""}`} disabled={updatingStatusId === recipe.id} onClick={() => handleStatusChange(recipe)}><span /></button><span className={`nutritionStatusLabel ${recipe.activa === false ? "nutritionStatusOff" : ""}`}>{recipe.activa === false ? "Inactiva" : "Activa"}</span></div></td>
                      <td><div className="nutritionRowActions">
                        <button type="button" aria-label={`Editar ${recipe.nombre}`} title="Editar" onClick={() => navigate(`/editar-receta/${recipe.id}`)}><Pencil size={15} /></button>
                        <button type="button" aria-label={`Visualizar ${recipe.nombre}`} title="Visualizar" onClick={() => setSelectedRecipe(recipe)}><Eye size={15} /></button>
                        <button type="button" aria-label={`Descargar PDF de ${recipe.nombre}`} title="Descargar PDF" disabled={downloadingId === recipe.id} onClick={() => handleDownload(recipe)}><Download size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!isLoading && visibleRecipes.length === 0 && <tr><td colSpan="10" className="nutritionEmpty">No hay recetas que coincidan con los filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="nutritionRecent">
            <div className="nutritionPanelHeading">
              <div className="nutritionHeadingIcon nutritionRecentIcon"><ChefHat size={20} /></div>
              <div><h3>Recetas agregadas recientemente</h3><p>Las últimas recetas añadidas al recetario.</p></div>
            </div>
            <div className="nutritionRecentGrid">
              {recentRecipes.map((recipe) => (
                <button type="button" className="nutritionRecentCard" key={recipe.id} onClick={() => setSelectedRecipe(recipe)}>
                  <div className="nutritionRecentImage">{recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : <Apple size={34} />}</div>
                  <strong>{recipe.nombre}</strong>
                  <span className="nutritionTag nutritionTagCategory">{recipe.categoria}</span>
                  <small><Clock3 size={13} /> {Number(recipe.tiempoPreparacion) || 0} min <i /> <Flame size={13} /> {recipeCalories(recipe)} kcal</small>
                </button>
              ))}
              {!isLoading && recentRecipes.length === 0 && <p className="nutritionEmptyRecent">Aún no hay recetas. Crea la primera con el botón «Nueva receta».</p>}
            </div>
          </section>
        </section>
      </main>

      {selectedRecipe && (
        <div className="nutritionModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRecipe(null); }}>
          <section className="nutritionDetailModal" role="dialog" aria-modal="true" aria-labelledby="nutrition-detail-title">
            <button type="button" className="nutritionModalClose" aria-label="Cerrar" onClick={() => setSelectedRecipe(null)}><X size={19} /></button>
            <div className="nutritionDetailImage">{selectedRecipe.imageUrl ? <img src={selectedRecipe.imageUrl} alt={selectedRecipe.nombre} /> : <Apple size={40} />}</div>
            <div className="nutritionDetailBody">
              <span className="nutritionTag nutritionTagCategory">{selectedRecipe.categoria}</span>
              <h2 id="nutrition-detail-title">{selectedRecipe.nombre}</h2>
              <p className="nutritionDetailDescription">{selectedRecipe.descripcion || "Sin descripción."}</p>
              <div className="nutritionDetailFacts"><span><Clock3 size={16} /> {Number(selectedRecipe.tiempoPreparacion) || 0} min</span><span><Flame size={16} /> {recipeCalories(selectedRecipe)} kcal / porción</span><span><Utensils size={16} /> {Number(selectedRecipe.porciones) || 1} porciones</span></div>
              <p className="nutritionDetailMeta">{selectedRecipe.tipoComida} · {selectedRecipe.objetivo} · Agregada {formatDate(selectedRecipe.creadoEn)}</p>
              <h3>Ingredientes</h3>
              <ul className="nutritionDetailList">{(selectedRecipe.ingredientes || []).map((ingredient, index) => <li key={`${ingredient.nombre}-${index}`}><span>{ingredient.nombre}</span><span>{ingredient.cantidad} {ingredient.unidad}</span></li>)}</ul>
              <h3>Preparación</h3>
              <ol className="nutritionDetailSteps">{(selectedRecipe.pasos || []).map((step, index) => <li key={`${step.titulo}-${index}`}><strong>{step.titulo} <small>({step.minutos} min)</small></strong><span>{step.descripcion}</span></li>)}</ol>
              <button type="button" className="nutritionPrimaryButton nutritionDetailPdf" disabled={downloadingId === selectedRecipe.id} onClick={() => handleDownload(selectedRecipe)}><Download size={16} /> Descargar receta PDF</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
