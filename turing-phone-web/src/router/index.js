import { createRouter, createWebHistory } from 'vue-router';
import StartGame from '../pages/StartGame.vue';
import Home from '../pages/Home.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/game/:gameId/:numberOfPlayers/player/:numPlayer/:namePlayer/start', component: StartGame },
];

const history = createWebHistory();

const router = createRouter({
  history,
  routes,
});

export default router;
