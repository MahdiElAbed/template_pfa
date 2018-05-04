<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
     <proj></proj>

  </div>
</template>

<script>
  //import Rtc from "./Rtc";
  //import message from "./message";
import  proj from "./proj"
export default {
  name: 'HelloWorld',
  //components: {Rtc,message},
  components: {proj},
  data () {
    return {
      msg: 'Welcome'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
