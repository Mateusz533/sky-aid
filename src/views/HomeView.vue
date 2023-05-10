<template>
  <FridgeController />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FridgeController from "@/components/FridgeController.vue";

export default defineComponent({
  name: "HomeView",
  components: {
    FridgeController,
  },
});
</script>
