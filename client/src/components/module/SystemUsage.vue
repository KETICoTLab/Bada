<template>
  <div class="usages">
    <div class="contents">
      <b-jumbotron>
        <template slot="lead">
          CPU Usage
        </template>
        <div class="icon-cpu"></div>
        <b-container class="usage">
          <b-row>
            <b-col>Server</b-col>
            <b-col class="value">{{Number(server.cpu).toFixed(2)}} %</b-col>
          </b-row>
          <b-row>
            <b-col>Process</b-col>
            <b-col class="value">{{Number(process.cpu).toFixed(2)}} %</b-col>
          </b-row>
        </b-container>
      </b-jumbotron>
      <b-jumbotron>
        <template slot="lead">
          Memory Usage
        </template>
        <div class="icon-memory"></div>
        <b-container class="usage">
          <b-row>
            <b-col>Server</b-col>
            <b-col class="value">{{Number(server.memory).toFixed(2)}} %</b-col>
          </b-row>
          <b-row>
            <b-col>Process</b-col>
            <b-col class="value">{{Number(process.memory).toFixed(2)}} %</b-col>
          </b-row>
        </b-container>
      </b-jumbotron>
      <b-jumbotron>
        <template slot="lead">
          Response Time (ms)
        </template>
        <b-container class="usage responsetime">
          <b-row>
            <b-col class="method-type">GET</b-col>
            <b-col class="method-type">POST</b-col>
            <b-col class="method-type">PUT</b-col>
            <b-col class="method-type">DELETE</b-col>
          </b-row>
          <b-row>
            <b-col class="method-value">{{ response_time.get ? response_time.get.toLocaleString() : '-'}}</b-col>
            <b-col class="method-value">{{ response_time.post ? response_time.post.toLocaleString() : '-'}}</b-col>
            <b-col class="method-value">{{ response_time.put ? response_time.put.toLocaleString() : '-'}}</b-col>
            <b-col class="method-value">{{ response_time.delete ? response_time.delete.toLocaleString() : '-'}}</b-col>
          </b-row>
        </b-container>
      </b-jumbotron>
    </div>
  </div>
</template>
<script src="../../controllers/system-usage.js"></script>
<style src="../../style/system-usage.scss" lang="scss" scoped></style>
