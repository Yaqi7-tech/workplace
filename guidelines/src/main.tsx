
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import WorkplaceApp from "./app/WorkplaceApp";
  import "./styles/index.css";

  // 根据环境变量选择使用哪个应用
  const appMode = (import.meta.env as any).VITE_APP_MODE || 'counseling';
  const AppComponent = appMode === 'workplace' ? WorkplaceApp : App;

  createRoot(document.getElementById("root")!).render(<AppComponent />);
  