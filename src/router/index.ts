import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import SimulatorView from "@/views/SimulatorView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/simulator",
    name: "simulator",
    component: SimulatorView,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
