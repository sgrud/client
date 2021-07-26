<script lang="ts" src="./VueComponent.ts"></script>
<style scoped lang="sass" src="./VueComponent.sass"></style>
<template>
  <div>
    <h1>vue-component says hello {{ name }}</h1>
    <div><slot></slot></div>
  </div>
</template>
