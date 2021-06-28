<template>
    <div>
        <template v-if="form">
            <v-container>
                <v-row dense>
                    <v-col sm="2" lg="1" class=".d-none .d-sm-flex"><v-img max-height="100" max-width="100" :src="form.image"></v-img></v-col>
                    <v-col sm="10" lg="11"><h1 style="text-transform: uppercase;">{{ form.title }} Test</h1></v-col>
                </v-row>
            </v-container>
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
