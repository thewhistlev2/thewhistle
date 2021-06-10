<template>
    <div>
        {{validToken}}
    </div>
</template>

<script>
export default {

    asyncData(context) {
        return {
            validToken: context.validToken
        }
    }

}
</script>
