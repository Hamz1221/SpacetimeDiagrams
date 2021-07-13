import Vue from 'vue'
import App from './App.vue'
import ImpVis from "@impvis/components"
import "@impvis/components/dist/impvis-components.css"
// TODO: Add in automated plugin uses for three + katex
import ImpVisKatex from "@impvis/components-katex"


Vue.config.productionTip = false
Vue.use(ImpVis);
Vue.use(ImpVisKatex)


new Vue({
  render: h => h(App),
}).$mount('#app')
