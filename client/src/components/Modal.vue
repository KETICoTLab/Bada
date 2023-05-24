<template>
    <b-modal id="myModal" title="Confirm" ref="modal"
             @ok="handle_ok"
             :ok-variant="okVariant"
             :header-bg-variant="headerBgVariant"
             :header-text-variant="headerTextVariant"
             :body-bg-variant="bodyBgVariant"
             :body-text-variant="bodyTextVariant">
      <p>{{modalContents}}</p>
    </b-modal>
</template>
<script src="../controllers/modal.js"></script>
