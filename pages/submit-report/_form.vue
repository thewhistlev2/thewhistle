<template>
    <div>
        <v-img max-height="150" max-width="250" :src="form.image"></v-img>
        <h1 style="text-transform: uppercase;">{{ form.title }}</h1>
        <div v-if="form.web">
                <no-ssr style="height: 100%">
                    <!-- TODO: Make work for multiple sections and other section types -->
                    <Webform :test="false" :form="form"></Webform>
                </no-ssr>
            </div>
        <div v-else-if="form.sections[0].type=='sms'">
            Display SMS Emulator Here
        </div>
    </div>
</template>

<script>
import Webform from '../../components/submitReport/Webform.vue'
//TODO: Make work for multiple sections
export default {
    components: {
        Webform
    },
    asyncData: (context) => {
        return {
            form: context.form
        }
    }
    
}
</script>
