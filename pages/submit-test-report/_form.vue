<template>
    <div>
        <template v-if="form">
            <h1 style="text-transform: uppercase;">{{ form.title }} Test</h1>
            <div v-if="form.web">
                <no-ssr style="height: 100%">
                    <!-- TODO: Make work for multiple sections and other section types -->
                    <Webform :test="true" :form="form"></Webform>
                </no-ssr>
            </div>
            <div v-else-if="form.sections[0].type=='sms'">
                Display SMS Emulator Here
            </div>
        </template>
        <template v-else>
            Could not get form.
        </template>
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
