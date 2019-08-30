<template>
    <div>
        <h1>{{ ans }}</h1>

    </div>
</template>



<script>
import axios from 'axios'
export default {

  asyncData (context) {
    return axios.get(`http://localhost:3000/displaygraphjson`).then(function(res){
      return {
        ans: res.data,
      }
    })
 }
}
</script>
