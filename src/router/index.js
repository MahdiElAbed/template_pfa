import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Rtc from '@/components/Rtc'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    },

      {
          path: '/rtc',
          name: 'rtc',
          component: Rtc
      }
  ]
})
