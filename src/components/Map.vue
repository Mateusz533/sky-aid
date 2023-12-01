<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

import { Loader } from "@googlemaps/js-api-loader";
const GOOGLE_MAPS_API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;

const props = defineProps<{
  currentLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
}>();
watch(
  () => props.currentLocation,
  (newValue) => setCurrentLocation(newValue)
);
watch(
  () => props.targetLocation,
  (newValue) => setTargetLocation(newValue)
);

const map = ref(null as google.maps.Map | null);
const paths = ref({
  startLine: null as google.maps.Polyline | null,
  endLine: null as google.maps.Polyline | null,
  startPoint: null as google.maps.Polyline | null,
  endPoint: null as google.maps.Polyline | null,
  currentPointBackground: null as google.maps.Polyline | null,
  currentPointBorder: null as google.maps.Polyline | null,
});
const targetLocation = ref({ lat: Number(), lng: Number() });

function setCurrentLocation(currentLocation: { lat: number; lng: number }) {
  const lostConnection =
    isNaN(currentLocation.lat) ||
    currentLocation.lat === null ||
    isNaN(currentLocation.lng) ||
    currentLocation.lng === null;

  if (lostConnection) {
    paths.value.currentPointBackground?.setOptions({
      strokeColor: "#777777",
    });
  } else {
    const startLocation = paths.value.startPoint
      ?.getPath()
      .getAt(0) as google.maps.LatLng;
    const endLocation = paths.value.endPoint
      ?.getPath()
      .getAt(0) as google.maps.LatLng;
    paths.value.currentPointBorder?.setPath([currentLocation, currentLocation]);
    paths.value.currentPointBackground?.setPath([
      currentLocation,
      currentLocation,
    ]);
    paths.value.startLine?.setPath([startLocation, currentLocation]);
    paths.value.endLine?.setPath([endLocation, currentLocation]);
    paths.value.currentPointBackground?.setOptions({
      strokeColor: "#0000FF",
    });
  }
}
function setTargetLocation(newtargetLocation: { lat: number; lng: number }) {
  if (
    targetLocation.value.lat === newtargetLocation.lat &&
    targetLocation.value.lng === newtargetLocation.lng
  )
    return;

  targetLocation.value = newtargetLocation;
  const currentLocation = paths.value.currentPointBackground
    ?.getPath()
    .getAt(0) as google.maps.LatLng;
  const startLocation = currentLocation;
  paths.value.startLine?.setPath([startLocation, currentLocation]);
  paths.value.endLine?.setPath([newtargetLocation, currentLocation]);
  paths.value.startPoint?.setPath([startLocation, startLocation]);
  paths.value.endPoint?.setPath([newtargetLocation, newtargetLocation]);
  map.value?.setCenter({
    lat: (startLocation.lat() + newtargetLocation.lat) / 2,
    lng: (startLocation.lng() + newtargetLocation.lng) / 2,
  });
  const scope = Math.max(
    Math.abs(startLocation.lat() - newtargetLocation.lat),
    Math.abs(startLocation.lng() - newtargetLocation.lng)
  );
  map.value?.setZoom(7.8 - 1.45 * Math.log(scope));
}

onMounted(async () => {
  const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY });
  await loader.load();
  const position = { lat: 52.203, lng: 21.001 };
  map.value = new google.maps.Map(
    document.getElementById("mapDiv") as HTMLElement,
    {
      center: position,
      zoom: 16,
    }
  );

  const lineOptions = {
    map: map.value,
    strokeOpacity: 0,
    icons: [
      {
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 4,
        },
        offset: "0",
        repeat: "20px",
      },
    ],
  };
  const grey = "#777777";
  const blue = "#0000FF";
  const white = "#FFFFFF";
  paths.value.startLine = new google.maps.Polyline({
    path: [position, position],
    strokeColor: grey,
    ...lineOptions,
  });
  paths.value.endLine = new google.maps.Polyline({
    path: [position, position],
    strokeColor: blue,
    ...lineOptions,
  });
  paths.value.startPoint = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: grey,
    strokeWeight: 10,
  });
  paths.value.endPoint = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: blue,
    strokeWeight: 10,
  });
  paths.value.currentPointBorder = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: white,
    strokeWeight: 22,
  });
  paths.value.currentPointBackground = new google.maps.Polyline({
    map: map.value,
    path: [position, position],
    strokeColor: blue,
    strokeWeight: 18,
  });
});
</script>

<template>
  <div class="google-map">
    <div id="mapDiv" style="width: 100%; height: 100%"></div>
  </div>
</template>

<style>
div.google-map {
  padding: 15px 0px;
  width: 100%;
  height: 350px;
}

div.google-map canvas {
  border-radius: 15px;
}
</style>
