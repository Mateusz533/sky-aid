<template>
  <TestSimulator />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import TestSimulator from "@/components/TestSimulator.vue";

export default defineComponent({
  name: "SimulatorView",
  components: {
    TestSimulator,
  },
});
</script>
