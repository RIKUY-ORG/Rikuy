import { Route, Routes } from "react-router-dom";

// import IndexPage from "@/pages/index";
import AboutPage from "@/pages/about";
import PrivacidadPage from "./pages/privacidad";
import TerminosPage from "./pages/terminos";
import ContactoPage from "@/pages/contacto";
// import ComoFuncionaPage from "@/pages/como-funciona";
// import PerfilPage from "@/pages/perfil";
// import ComunidadesPage from "@/pages/comunidades";
import TutorialPage from "@/pages/tutorial";
import AyudaPage from "@/pages/ayuda";
import DenunciarPage from "./pages/Denuncia";
import ComoFuncionaPage from "./pages/comoFunciona";
import PhotoPage from "./pages/Denuncia/foto";
import VideoPage from "./pages/Denuncia/video";
import RecorderPage from "./pages/Denuncia/audio";
import ComunidadesPage from "./pages/Comunidad";
import PerfilPage from "./pages/perfil";
import LoginPage from "./pages/login";
import SoportePage from "@/pages/soporte";
import IndexPage from "./pages/Landing";
import MetricsFullPage from "./pages/Map";

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route element={<IndexPage />} path="/" />
      <Route element={<MetricsFullPage />} path="/mapa" /> 
      <Route element={<AboutPage />} path="/sobre-nosotros" />
      <Route element={<DenunciarPage />} path="/denunciar" />
      <Route element={<PhotoPage />} path="/denunciar/foto" />
      <Route element={<VideoPage />} path="/denunciar/video" />
      <Route element={<RecorderPage />} path="/denunciar/audio" />
      <Route element={<ComoFuncionaPage />} path="/como-funciona" />
      <Route element={<PrivacidadPage />} path="/privacidad" />
      <Route element={<TerminosPage />} path="/terminos" />
      <Route element={<ContactoPage />} path="/contacto" />
      <Route element={<ComunidadesPage />} path="/comunidades" />
      <Route element={<TutorialPage />} path="/tutorial" />
      <Route element={<AyudaPage />} path="/ayuda" />
      <Route element={<SoportePage />} path="/soporte" />
      <Route element={<LoginPage />} path="/login" />

      {/* Protegidas (por ahora públicas, luego las envolvemos con ProtectedRoute) */}
      <Route element={<PerfilPage />} path="/perfil" />
    </Routes>
  );
}

export default App;
