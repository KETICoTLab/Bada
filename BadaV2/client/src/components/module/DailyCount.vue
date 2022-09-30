<template>
  <div class="weekly-count">
    <div class="contents">
      <!-- <div class=""></div> -->
      <div class="title">Daily Content Instance Creation Count</div>
      <div class="duration">
        <b-button-toolbar>
            <b-button v-on:click='setDuration("week")'>A Week</b-button>
            <b-button @click='setDuration("2weeks")'>2 Weeks</b-button>
            <b-button @click='setDuration("month")'>A Month</b-button>
        </b-button-toolbar>
        <div class="input-area">
          <div>
            {{duration.start_date}} ~ {{duration.end_date}}
          </div>
        </div>
      </div>
      
      <div class="cin-chart">
        <IEcharts ref="bar_chart" :option="chartOption" :resizable=true :loading="loading" />
      </div>
    </div>
  </div>
</template>
<script src="../../controllers/daily-count.js"></script>
<style src="../../style/daily-count.scss" lang="scss" scoped></style>

