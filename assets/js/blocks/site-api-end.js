(function (win, $) {
  "use strict";
  let api = win.SiteApi;

  /*VUE*/
/*  api.VUE.services.auth();
  //or
  api.addDocReadyCallback({
    order:0,
    func: api.VUE.services.auth
  });*/
  /*VUE end*/

  api.lazyLoad();
  api.createAnimation();

  //load
  // api.loadingPage();
  /*after loaded*/
  api.loadedPage();

  $(document).ready(function () {
    api.isTouch();
    api.isIOS();
    //api.isIE11();
    api.runDocReadyCallbacks();
    api.buildWindowEvents();
  });

}(window, jQuery));
