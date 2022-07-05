(function (win, $) {
  "use strict";

  let SiteApi = (function () {
    // Private methods and fields
    let instance;
    let $win = $(win);
    let drupalObj = $win.Drupal;
    let doc = document;
    let bodySelector = 'body';
    let windowEvents = {
      /*scroll:{
        default:[],
        hasDelay:[]
      },
      resize:{
        default:[],
        hasDelay:[]
      },
      orientationchange:{
        default:[],
        hasDelay:[]
      }*/
    }
    let docReadyCallbacks = [];
    let
      lazyLoadCreated = false,
      lazyLoadCallbackOrder = 2,
      lazyLoadCallbackType = 'lazy',
      lazyPrefix = '.lazy-',
      $lazyLoadBlocks = $(),
      currentSrcAttrName = 'data-current-src',
      _getLazyBlocksSelector = function () {
        return `${lazyPrefix}bg, ${lazyPrefix}img, ${lazyPrefix}video`;
      };

    let
      $animatedBlocks = $(),
      isAnimationCreated = false,
      additionalAnimations = [],
      animationCallbackType = 'animation',
      classNameRunAnimation = 'fadein',
      classNameAnimated = 'animated',
      _getAnimationSelector = function () {
        return `.${classNameRunAnimation}, .${classNameRunAnimation}-only, .${classNameRunAnimation}-custom`;
      };

    /*JW player (private part)*/
    let
      controlVideoCreated = false,
      controlVideoCallbackType = 'controlVideo',
      videoBlocksSelector = '.jw-holder',
      $videoBlocks = $(),
      JW = (function () {
        /*Params that can be on data-attributes:
      1) data-player-id
      2) data-player-id-mob
      3) data-jw-id
      4) data-jw-id-mob
      5) data-error-thumb
      6) data-error-thumb-mob
      7) data-params
      8) data-params-mob
      9) data-aspectratio
      10) data-aspectratio-mob
      11) data-stretching
      12) data-stretching-mob
      13) data-loop
      14) data-loop-mob
      15) data-sound
      16) data-sound-mob
      17) data-controls
      18) data-controls-mob
      19) data-compare-id
      20) data-large-breakpoint
      **/

        let
          defaultLargeBreakpoint = 1024,
          jwHolderErrorClassName = 'jw-holder-error',
          startVideoAnimationClassName = 'start-video-animation',
          lazyBlockLoadedEventName = 'lazyBlockLoaded',
          lazyLoadedClassName = 'lazy-loaded',
          pauseClassName = 'pause',
          playClassName = 'play',
          errorThumbAttrName = 'error-thumb';

        function _getIsLargeBreakpoint(jwHolder) {
          let
            winWidth = win.innerWidth,
            curLargeBreakpoint = jwHolder.data('large-breakpoint'),
            largeBreakpoint = curLargeBreakpoint ? (curLargeBreakpoint * 1) : defaultLargeBreakpoint;

          return winWidth >= largeBreakpoint;
        }

        function _getJWParameter(jwHolder, isLargeBreakpoint, key) { //mobile or desktop
          let option = jwHolder.data(key + '-mob') || jwHolder.data(key);

          if (isLargeBreakpoint) {
            option = jwHolder.data(key);
          }

          return option;
        }

        function _getCurrentJwIdOnBreakpoint(jwHolder) {
          let isLargeBreakpoint = _getIsLargeBreakpoint(jwHolder);

          return _getJWParameter(jwHolder, isLargeBreakpoint, 'jw-id');
        }

        function _getJWposter(jwHolder, jwAPIresponse) {
          let
            playerWidth = parseInt(jwHolder.outerWidth()),
            breakpoints = [0, 320, 480, 640, 720, 1280, 1920],
            i = 0,
            posterWidth,
            src = (jwAPIresponse.playlist[0].image.split('?'))[0];

          for (; i < breakpoints.length; i++) {
            if (breakpoints[i] <= playerWidth) {
              posterWidth = breakpoints[i];
            } else {
              break;
            }
          }

          posterWidth = (breakpoints[i] === undefined) ? posterWidth : breakpoints[i];
          return src + '?width=' + posterWidth;
        }

        function _loadPlayerJSON(jwHolder, isUpdate) {
          let
            isLargeBreakpoint = _getIsLargeBreakpoint(jwHolder),
            options = getJWplayerParams(jwHolder, isLargeBreakpoint),
            player = $('<div/>', {
              id: (jwHolder.data('player-id' + (isLargeBreakpoint ? '' : '-mob')))
            });

          if (isUpdate) {
            let createdPlayer = jwHolder.find('> .jwplayer');
            jwplayer(createdPlayer[0]).remove();
          }

          jwHolder.addClass('init-player default ').append(player);

          let jwID = _getCurrentJwIdOnBreakpoint(jwHolder);

          jwHolder.attr('data-current-jw-id', jwID);

          $.getJSON(('https://cdn.jwplayer.com/v2/media/' + jwID), function (data) {
            data.playlist[0].image = _getJWposter(jwHolder, data);
            options.params.playlist = data.playlist;
            logicJWplayer(jwHolder, player, options);

          }).fail(function () {
            errorHandlerJWplayer(jwHolder);
          });
        }

        function createJWplayer(jwHolder) {
          let
            isCustomPlayerBuild = jwHolder.data('data-params') !== undefined,
            isResponsivePlayer = false;

          if (jwHolder.hasClass('open-in-popup')) {
            jwHolder.addClass('end');
          }

          if (isCustomPlayerBuild) {


            isResponsivePlayer = jwHolder.data('data-params-mob') !== undefined;

            if (isResponsivePlayer) {
              if (!jwHolder.hasClass('run-lazy-video')) {
                jwHolder.addClass('run-lazy-video');

                let
                  isLargeBreakpoint = _getIsLargeBreakpoint(jwHolder),
                  options = getJWplayerParams(jwHolder, isLargeBreakpoint),
                  player = $('<div/>', {
                    id: (jwHolder.data('player-id' + (isLargeBreakpoint ? '' : '-mob')))
                  });

                if (jwHolder.hasClass('lazy-loaded')) {
                  if (jwHolder.attr('data-current-jw-id') === _getCurrentJwIdOnBreakpoint(jwHolder)) {
                    jwHolder.removeClass('run-lazy-video');
                  } else {
                    let createdPlayer = jwHolder.find('> .jwplayer');
                    jwplayer(createdPlayer[0]).remove();
                    jwHolder.addClass('init-player').append(player);
                    logicJWplayer(jwHolder, player, options);
                  }

                } else {
                  jwHolder.addClass('init-player').append(player);
                  logicJWplayer(jwHolder, player, options);
                }
              }
            } else {

              if (!jwHolder.hasClass('init-player')) {
                let
                  options = getJWplayerParams(jwHolder),
                  player = $('<div/>', {
                    id: jwHolder.data('player-id')
                  });

                jwHolder.addClass('init-player').append(player);
                logicJWplayer(jwHolder, player, options);
              }
            }


          } else {
            isResponsivePlayer = jwHolder.data('jw-id-mob') !== undefined;

            if (isResponsivePlayer) {
              if (!jwHolder.hasClass('run-lazy-video')) {
                jwHolder.addClass('run-lazy-video');

                if (jwHolder.hasClass('lazy-loaded')) {
                  if (jwHolder.attr('data-current-jw-id') === _getCurrentJwIdOnBreakpoint(jwHolder)) {
                    jwHolder.removeClass('run-lazy-video');
                  } else {
                    _loadPlayerJSON(jwHolder, true);
                  }

                } else {
                  _loadPlayerJSON(jwHolder);
                }

              }
            } else {
              if (!jwHolder.hasClass('init-player')) {
                _loadPlayerJSON(jwHolder);
              }
            }
          }
        }

        function errorHandlerJWplayer(jwHolder) {
          if (!jwHolder.hasClass(jwHolderErrorClassName)) {
            jwHolder.addClass(jwHolderErrorClassName);

            let
              isLargeBreakpoint = _getIsLargeBreakpoint(jwHolder),
              srcDefault = jwHolder.data(errorThumbAttrName),
              srcMobile = jwHolder.data(errorThumbAttrName + '-mob'),
              src = isLargeBreakpoint ? srcDefault : srcMobile,
              newImg = new Image();

            newImg.onload = function () {
              jwHolder.append(`<span class="video-error-thumb" style="background-image:url('${src}');"><img src="${src}" alt="video error thumb"></span>`);

              setTimeout(function () {
                jwHolder.addClass('thumb-error-loaded');
              }, 100);

            };

            newImg.src = src;
          }
        }

        function logicJWplayer(jwHolder, player, options) {
          let
            //debounce,
            classList = options.isCustom ? 'custom-params' : '',
            playerInstance = jwplayer(player[0]).setup(options.params);

          jwHolder.removeClass('run-lazy-video');

          if (!options.isCustom) {
            let errorHandler = function (jwHolder) {
              errorHandlerJWplayer(jwHolder);
            };

            playerInstance.on('setupError', function () {
              errorHandler(jwHolder);

            }).on('error', function () {
              errorHandler(jwHolder);

            });
          }

          playerInstance.on('ready', function () {
            jwHolder.addClass(('ready-player ' + classList + ' ' + lazyLoadedClassName)).trigger(lazyBlockLoadedEventName);
            controlVideo(jwHolder);
            jwHolder.addClass(startVideoAnimationClassName);

          }).on('play', function () {
            //clearInterval(debounce);
            jwHolder.removeClass(pauseClassName).addClass(playClassName);

          }).on('pause', function () {
            jwHolder.removeClass(playClassName).addClass(pauseClassName);

          }).on('remove', function () {
            jwHolder.find('>div:empty').remove();
          });

          if (options.params.repeat) {
            jwHolder.addClass('loop');

          } else if (!options.isCustom) {
            playerInstance.on('complete', function () {
              jwHolder.addClass(`end ${pauseClassName}`).removeClass(playClassName);
              jwplayer(player[0]).pause();
            });
          }
        }

        function getJWplayerParams(jwHolder, isLargeBreakpoint) {
          let
            result = {
              isCustom: false,
              params: {}
            },
            customParams = _getJWParameter(jwHolder, isLargeBreakpoint, 'params');

          if (customParams) {
            result.isCustom = true;
            //result.params = JSON.parse(customParams);
            result.params = customParams;

          } else {
            let
              aspectratio = _getJWParameter(jwHolder, isLargeBreakpoint, 'aspectratio'),
              loop = _getJWParameter(jwHolder, isLargeBreakpoint, 'loop'),
              sound = _getJWParameter(jwHolder, isLargeBreakpoint, 'sound'),
              controls = _getJWParameter(jwHolder, isLargeBreakpoint, 'controls'),
              isLargeScreen = win.screen.width >= 1200,
              jwDefaults = {
                repeat: false,
                autostart: false,
                mute: true,
                controls: false,
                displaydescription: false,
                displaytitle: false,
                renderCaptionsNatively: false,
                height: '100%',
                width: '100%',
                stretching: _getJWParameter(jwHolder, isLargeBreakpoint, 'stretching')
                /*
                 none
                 uniform
                 exactfit
                 fill
                 */
              };

            if (isLargeScreen) {
              jwDefaults.defaultBandwidthEstimate = 5000000;
            }

            result.params = $.extend(true, jwDefaults, {
              aspectratio: (aspectratio ? aspectratio : '-'),
              repeat: (loop && loop.toString() == 'true'),
              mute: !(sound && sound.toString() == 'true'),
              controls: (controls && controls.toString() == 'true')
            });
          }

          return result;
        }

        function controlVideoPlay(jwHolder) {
          jwHolder.each(function () {
            let cur = $(this);

            if (!cur.hasClass('end') && cur.hasClass('ready-player')) {
              let player = cur.find('> .jwplayer');

              if (player.length) {
                if (!_isInViewport(cur, 0)) {
                  /*console.log(player.attr('id') + ' trigger pause');*///debug mode
                  jwplayer(player[0]).pause();

                } else if (cur.hasClass("visible")) {

                  if (!cur.hasClass('custom-params')) {
                    /*console.log(player.attr('id') + ' trigger play');*/ //debug mode
                    jwplayer(player[0]).play();
                  }

                } else {
                  /*console.log(player.attr('id') + ' trigger pause');*/ //debug mode
                  jwplayer(player[0]).pause();
                }
              }

            }
          });
        }

        function controlVideo(jwHolder) {
          let videoBlocks = controlVideoCreated ? jwHolder : $(videoBlocksSelector);

          if (videoBlocks.length) {
            $videoBlocks = $videoBlocks.add(videoBlocks);

            let eventFunc = function () {
              controlVideoPlay($videoBlocks);
            };

            _addWindowEvent({
              type: controlVideoCallbackType,
              order: 3,
              func: eventFunc
            });

            _addWindowEvent({
              type: controlVideoCallbackType,
              event: 'orientationchange',
              order: 3,
              func: eventFunc
            });

            eventFunc();
            controlVideoCreated = true;
          }
        }

        return {
          createJWplayer: createJWplayer,
          getJWplayerParams: getJWplayerParams,
          controlVideoPlay: controlVideoPlay,
          controlVideo: controlVideo
        }
      }());

    /*JW player (private part) end*/

    function _sortByOrder(a, b) {
      return (a.order > b.order) ? 1 : -1;
    }

    function _getEventDelay(eventName) { //Get duration event has delay
      let delay;
      switch (eventName) {
        case "scroll":
          delay = 100;
          break;

        default:
          delay = 405;
      }

      return delay;
    }

    /*throttle*/
    function _throttle(func, delay) {
      let timer = null;

      return function () {
        let context = this;
        let args = arguments;

        if (timer == null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }

    /*throttle end*/

    /* get/set props*/
    function _getProp(object, path, value) {
      const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
      const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part)

      return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || value
    }

    function _setProp(obj, path, value) {
      if (Object(obj) !== obj) return obj; // When obj is not an object
      // If not yet an array, get the keys from the string-path
      if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
      path.slice(0, -1).reduce((a, c, i) => // Iterate all of them except the last one
          Object(a[c]) === a[c] // Does the key exist and is its value an object?
            // Yes: then follow that path
            ? a[c]
            // No: create the key. Is the next key a potential array-index?
            : a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1]
            ? [] // Yes: assign a new array object
            : {}, // No: assign a new plain object
        obj)[path[path.length - 1]] = value; // Finally assign the value to the last key
      return obj; // Return the top-level object to allow chaining
    }

    /* get/set props end*/

    /*Check block position in viewport*/
    function _isInViewport(obj, coefficientOffsetVH) {//0 - 300%
      let
        offsetTop = parseInt(obj.offset().top),
        winScrollTop = $win.scrollTop(),
        bottomPosition = parseInt(offsetTop + obj.outerHeight()),
        winHeight = $win.height(),
        diffHeight = coefficientOffsetVH == 0 ? -5 : (winHeight / 100 * coefficientOffsetVH);

      return !((bottomPosition < winScrollTop) || ((offsetTop - diffHeight) > (winScrollTop + winHeight)));
    }

    /*Check block position in viewport end*/

    /*Add animation to blocks*/
    function _addAnimation(obj, isDocReadyEvent) {
      obj.each(function () {
        let cur = $(this);

        if (!cur.hasClass(classNameAnimated)) {
          let classList = classNameAnimated;

          if (_isInViewport(cur, -13)) {

            if (isDocReadyEvent) {
              classList += ` ${classNameAnimated}-init`;
            }

            cur.addClass(classList);

            if (additionalAnimations.length) {
              additionalAnimations.map((item) => {
                item.func(cur, classList);
              });
            }
          }
        }
      });
    }

    /*Add animation to blocks end*/

    /* Window events methods (private part)*/
    function _addWindowEvent(options) {
      let defaultOptions = {
          type: 'none',
          order: 15,
          func: null,
          event: 'scroll',
          hasDelay: true
        },
        params = $.extend(defaultOptions, (options ? options : {})),
        eventGroupType = params.hasDelay ? 'hasDelay' : 'default',
        hasEvent = _getProp(windowEvents, `${params.event}`),
        setCallback = function () {
          _setProp(windowEvents, `${params.event}.${eventGroupType}`, [params]);
        };

      if (hasEvent) {
        let hasEventGroupArray = _getProp(windowEvents, `${params.event}.${eventGroupType}`);

        if (hasEventGroupArray) {
          //if the event has objects with these same types, then replace the collection of objects
          let
            eventCallbackTypesReplacedObjects = [lazyLoadCallbackType, animationCallbackType, controlVideoCallbackType],
            isCurrentCallbackReplacedType = function () {
              let
                result = false,
                i = 0;

              for (i; i < eventCallbackTypesReplacedObjects.length; i++) {
                if (eventCallbackTypesReplacedObjects[i] === params.type) {
                  result = true;
                  break;
                }
              }
              return result;
            }();

          if (isCurrentCallbackReplacedType) {

            let indexOfCallbackHasCurrentCallbackType = function () {
              let
                result = -1,
                i = 0;

              for (i; i < hasEventGroupArray.length; i++) {
                if (hasEventGroupArray[i].type === params.type) {
                  result = i;
                  break
                }
              }

              return result;
            }();

            if (indexOfCallbackHasCurrentCallbackType === -1) {
              windowEvents[params.event][eventGroupType].push(params);

            } else {
              windowEvents[params.event][eventGroupType][indexOfCallbackHasCurrentCallbackType] = params;
            }

          } else {
            windowEvents[params.event][eventGroupType].push(params);
          }

        } else {
          setCallback();
        }

      } else {
        setCallback();
      }
    }

    /*Window events methods (private part) end*/

    /*Lazy loading methods (private part)*/
    function _getCurrentSrcOnBreakpoint(lazyObjItemOptions) {
      let
        winWidth = win.innerWidth,
        defaultLargeBreakpoint = 1024,
        lazyObjItemLargeBreakpoint = lazyObjItemOptions.item.data('large-breakpoint'),
        largeBreakpoint = lazyObjItemLargeBreakpoint ? (lazyObjItemLargeBreakpoint * 1) : defaultLargeBreakpoint,
        isLargeBreakpoint = winWidth >= largeBreakpoint;

      return isLargeBreakpoint ? lazyObjItemOptions.srcDefault : lazyObjItemOptions.srcMobile;
    }

    function _setCurrentSrcAttr($obj, src) {
      $obj.attr(currentSrcAttrName, src);
    }

    function _getCurrentSrcAttr($obj) {
      return $obj.attr(currentSrcAttrName);
    }

    function _imgLoadBehavior(lazyObjItemOptions, isUpdate) {
      let
        newImg = new Image(),
        isPrepend = lazyObjItemOptions.item.hasClass('is-prepend');

      newImg.onload = function () {
        lazyObjItemOptions.item.addClass("lazy-loaded");

        let isLazyBgType = lazyObjItemOptions.item.hasClass('lazy-bg');

        if (isLazyBgType) {
          lazyObjItemOptions.item.css('background-image', `url("${lazyObjItemOptions.src}")`);
        }

        if (isUpdate) {
          lazyObjItemOptions.item.find('.lazy-image').attr('src', lazyObjItemOptions.src);

        } else {
          let alt = lazyObjItemOptions.item.data('alt');

          if (alt !== undefined) {
            newImg.setAttribute('alt', alt);
          }

          newImg.classList.add("lazy-image");

          lazyObjItemOptions.item[`${isPrepend ? 'pre' : 'ap'}pend`](newImg);
        }

        if (lazyObjItemOptions.hasMobileSrc) {
          _setCurrentSrcAttr(lazyObjItemOptions.item, lazyObjItemOptions.src);
          /*
          there may be a situation when the picture is large and at the time of its loading the orientation of the device has changed. There will be an asynchronous situation when the function does not allow loading another image until the first one has loaded. Possible fix.
           */
          let
            correctSrcOnBreakpoint = _getCurrentSrcOnBreakpoint(lazyObjItemOptions),
            isLoadedSrcCorrectOnBreakpoint = lazyObjItemOptions.src === correctSrcOnBreakpoint;

          if (isLoadedSrcCorrectOnBreakpoint) {
            lazyObjItemOptions.item.removeClass('run-lazy').trigger('lazyBlockLoaded');
          } else {
            lazyObjItemOptions.src = correctSrcOnBreakpoint;
            _imgLoadBehavior(lazyObjItemOptions, true);
          }

        } else {
          lazyObjItemOptions.item.trigger('lazyBlockLoaded');
        }
      };

      newImg.src = lazyObjItemOptions.src;
    }

    function _loadSingleSrc(lazyObjItemOptions) {
      if (!lazyObjItemOptions.item.hasClass('lazy-init')) {
        lazyObjItemOptions.src = lazyObjItemOptions.srcDefault;
        _imgLoadBehavior(lazyObjItemOptions);
      }
    }

    function _loadResponsiveSrc(lazyObjItemOptions) { //has src end src-mob
      if (!lazyObjItemOptions.item.hasClass('run-lazy')) {
        lazyObjItemOptions.item.addClass('run-lazy');

        lazyObjItemOptions.src = _getCurrentSrcOnBreakpoint(lazyObjItemOptions);

        if (lazyObjItemOptions.item.hasClass('lazy-loaded')) {
          if (lazyObjItemOptions.src === _getCurrentSrcAttr(lazyObjItemOptions.item)) {
            lazyObjItemOptions.item.removeClass('run-lazy');
          } else {
            _imgLoadBehavior(lazyObjItemOptions, true);
          }
        } else {
          _imgLoadBehavior(lazyObjItemOptions);
        }
      }
    }

    function _createLazyBgOrImg(lazyObjItem) {
      let
        srcDefault = lazyObjItem.data('src'), //default desktop src required
        srcMobile = lazyObjItem.data('src-mob'),
        options = {
          item: lazyObjItem,
          srcDefault: srcDefault,
          srcMobile: srcMobile,
          src: '', //set end loaded src depending on conditions
          hasDefaultSrc: srcDefault !== undefined,
          hasMobileSrc: srcMobile !== undefined
        };

      if (options.hasDefaultSrc) {
        options.hasMobileSrc ? _loadResponsiveSrc(options) : _loadSingleSrc(options);
      }
    }

    function _lazyLoadStrategy(lazyObjItem) {
      if (lazyObjItem.hasClass('lazy-video')) {
        /*video part*/
        JW.createJWplayer(lazyObjItem);
        /*video part end*/

      } else {
        _createLazyBgOrImg(lazyObjItem);
      }

      lazyObjItem.addClass("lazy-init");
    }

    function _lazyLoadInit(options) {
      let
        defaultOptions = {
          obj: $(),
          isForceLoad: false,
          isInit: false
        },
        params = $.extend(defaultOptions, (options ? options : {}));

      params.obj.each(function () {
        let lazyObjItem = $(this);

        if (params.isForceLoad) {
          _lazyLoadStrategy(lazyObjItem);

        } else {
          // if (!lazyObjItem.hasClass('lazy-init') && (lazyObjItem.css('visibility') != 'hidden') && lazyObjItem.hasClass('visible')) {
          if ((lazyObjItem.css('visibility') != 'hidden') && lazyObjItem.hasClass('visible')) {

            if (_isInViewport(lazyObjItem, (params.isInit ? 0 : 30))) {
              _lazyLoadStrategy(lazyObjItem);
            }
          }
        }
      });
    }

    function _lazyLoad(options) {
      let lazyOptions = options || {obj: $(_getLazyBlocksSelector())};
      if (lazyOptions.obj.length) {
        $lazyLoadBlocks = $lazyLoadBlocks.add(lazyOptions.obj);
        lazyOptions.obj = $lazyLoadBlocks;

        if (!lazyLoadCreated) {
          _addDocReadyCallback({
            type: lazyLoadCallbackType,
            order: lazyLoadCallbackOrder,
            func: function () {
              _lazyLoadInit({
                isInit: true,
                isForceLoad: Boolean(lazyOptions.isForceLoad),
                obj: lazyOptions.obj
              });
            }
          });
        } else {
          _lazyLoadInit(lazyOptions);
        }

        ['', 'resize', 'orientationchange'].map((item) => {
          let eventObj = {
            type: lazyLoadCallbackType,
            order: lazyLoadCallbackOrder,
            func: function () {
              _lazyLoadInit(lazyOptions);
            }
          }
          if (item) {
            eventObj.event = item;
          }
          _addWindowEvent(eventObj);
        });

        lazyLoadCreated = true;
      }
    }

    /*Lazy loading methods (private part) end*/

    /* Document ready callbacks methods (private part)*/
    function _addDocReadyCallback(options) {
      let defaultOptions = {
          order: 15,
          //funcName:'',
          func: null
        },
        params = $.extend(defaultOptions, (options ? options : {}));

      docReadyCallbacks.push(params);
    }

    /* Document ready callbacks methods (private part) end*/

    /*Scroll to functions (private part)*/
    function _scrollTo(position, callback, duration = 400) {
      $(bodySelector + ', html').animate({scrollTop: position}, duration, function () {
        if (callback) {
          callback();
        }
      });
    }

    function _scrollToRecursion(target, duration = 200) {
      let
        getPosition = function () {
          let
            header = $('#header'),
            correctionPosition = 0;

          if (header.length) {
            correctionPosition = parseInt(header.outerHeight());
          }

          return parseInt(target.offset().top) - correctionPosition;
        },
        position = getPosition();

      _scrollTo(position, function () {
        let newPosition = getPosition();
        /*an extra scroll cycle (starting an additional iteration recursion) is made specifically to make allowances for lazy loading blocks*/
        if (position != newPosition) {
          _scrollToRecursion(target);
        }
      });
    }

    function _ajaxHook(ajaxHookNamespace, callback) {
      if (drupalObj) {

        drupalObj.behaviors[ajaxHookNamespace] = {
          attach: function (context) {
            if (drupalObj.ajax && callback) {
              callback(context);
            }
          }
        };
      }
    }

    _addDocReadyCallback({
      func: function () { //goToAnchor
        let anchorAttrName = 'data-goto-anchor';

        $(bodySelector).on('click', '[' + anchorAttrName + ']', function (e) {
          e.preventDefault();

          let _this = $(this);

          _scrollToRecursion($(`[data-anchor=${_this.attr(anchorAttrName)}]`), 400);
        });
      }
    })
    /*Scroll to functions (private part) end*/


    /*Vue.js (private part)*/
    let VUE = {
      api: {
        /*init global api functions, and extend with other files*/
      },
      store: {},
      components: {
        /*init global components functions, and extend with other files*/
      },
      services: {
        /*init global services functions, and extend with other files*/
        auth: function () {
          //...
        }
      }
    };
    /*Vue.js (private part) end*/

    // Constructor
    function SiteApi() {
      if (!instance) {
        instance = this;
      } else {
        return instance;
      }
      // Public fields
    }

    // Public methods
    SiteApi.prototype.getProp = _getProp;

    SiteApi.prototype.setProp = _setProp;

    SiteApi.prototype.isInViewport = _isInViewport;

    /*Lazy loading methods (public part)*/
    SiteApi.prototype.lazyLoad = _lazyLoad;

    SiteApi.prototype.getLazyBlocksSelector = _getLazyBlocksSelector;
    /*Lazy loading methods (public part) end*/

    /*Document ready callbacks methods (public part)*/
    SiteApi.prototype.addDocReadyCallback = _addDocReadyCallback;

    SiteApi.prototype.runDocReadyCallbacks = function () {
      docReadyCallbacks.sort(_sortByOrder).forEach(function (item) {
        item.func();
      });
    };
    /*Document ready callbacks methods (public part) end*/

    /*Window events methods (public part)*/
    SiteApi.prototype.addWindowEvent = _addWindowEvent;

    SiteApi.prototype.buildWindowEvents = function () {
      for (let windowEvent in windowEvents) {

        if (windowEvents.hasOwnProperty(windowEvent)) {

          let curEventObj = windowEvents[windowEvent];

          for (let eventType in curEventObj) {

            let
              hasDelayType = eventType === 'hasDelay',
              curArray = curEventObj[eventType],
              callback = function (e) {
                // console.log(e.type);
                curArray.sort(_sortByOrder).forEach(function (item) {
                  item.func();
                });
              };

            $win.on(windowEvent + '.' + eventType, hasDelayType ? _throttle(callback, _getEventDelay(windowEvent)) : callback);
          }
        }
      }
    };

    /* SiteApi.prototype.getWindowEvents = function () {
       return windowEvents;
     };*/
    /*Window events methods (public part) end*/

    /*Add animation methods (public part)*/
    SiteApi.prototype.createAnimation = function (animatedBlocks) {
      let  _animatedBlocks = (isAnimationCreated && animatedBlocks !== undefined) ? animatedBlocks : $(_getAnimationSelector());

      if (_animatedBlocks.length) {
        $animatedBlocks = $animatedBlocks.add(_animatedBlocks);

        if (!isAnimationCreated) {
          _addDocReadyCallback({
            type: animationCallbackType,
            order: 3,
            func: function () {
              _addAnimation($animatedBlocks, true);
            }
          });
        }

        _addWindowEvent({
          type: animationCallbackType,
          order: 3,
          func: function () {
            _addAnimation($animatedBlocks);
          }
        });

        _addAnimation($animatedBlocks, !isAnimationCreated);
        isAnimationCreated = true;
      }
    };

    SiteApi.prototype.addAdditionalAnimation = function (options) {
      let defaultOptions = {
          type: 'none',
          func: null
        },
        params = $.extend(defaultOptions, (options ? options : {})),
        i = 0,
        hasSameType = false;

      if (params.type !== 'none') {
        for (i; i < additionalAnimations.length; i++) {
          if (additionalAnimations[i].type === params.type) {
            hasSameType = true;
            break;
          }
        }
      }

      if (hasSameType) {
        additionalAnimations[i] = params;
      } else {
        additionalAnimations.push(params);
      }
    };

    SiteApi.prototype.getAnimationSelector = _getAnimationSelector;
    /*Add animation methods (public part) end*/

    /*JW player (public part)*/
    SiteApi.prototype.playVideo = function (tabItem) {
      let
        curPlayer = tabItem.find('.jw-holder').addClass('visible'),
        otherPlayers = tabItem.siblings().find('.jw-holder'),
        allPlayers = curPlayer.add(otherPlayers);

      otherPlayers.removeClass('visible');
      JW.controlVideo(allPlayers); /*TODO test this code*/
    };

    SiteApi.prototype.controlVideo = JW.controlVideo;
    /*JW player (public part) end*/

    /*utils (public part)*/
    SiteApi.prototype.getPreviousItemsWidth = function (list, curListItemIndex) {
      let width = 0;

      list.children(`:lt(${curListItemIndex})`).each(function () {
        width += parseInt($(this).outerWidth(true));
      });

      return width;
    };

    SiteApi.prototype.throttle = _throttle;

    /*Add checkers utils (public part)*/
    [
      {
        name: 'isTouch',
        cond: ("ontouchstart" in win),
        class: 'touch'
      },
      {
        name: 'isIOS',
        cond: (/iPad|iPhone|iPod/.test(navigator.userAgent) && !win.MSStream),
        class: 'ios'
      }/*,
      {
        name: 'isIE11',
        cond: (!!win.MSInputMethodContext && !!doc.documentMode),
        class: 'ie11'
      }*/
    ].forEach(function (item) {
      SiteApi.prototype[item.name] = function () {
        let flag = item.cond;

        doc.body.classList.add((flag ? '' : 'no-') + item.class);
        return flag;
      }
    });
    /*Add checkers utils (public part) end*/

    SiteApi.prototype.isMobileDevice = function () {
      let
        isTouchDevice = ('ontouchstart' in win) || win.DocumentTouch && doc instanceof win.DocumentTouch,
        isWinPhoneDevice = /Windows Phone/.test(navigator.userAgent);

      return !!(isTouchDevice || isWinPhoneDevice);
    };

    SiteApi.prototype.scrollTo = _scrollTo;

    SiteApi.prototype.getNotValidFieldsNames = function (form) {
      let
        result = [],
        notValidSelector = '.not-valid',
        fields = form.find('input' + notValidSelector + ', select' + notValidSelector + ', textarea' + notValidSelector);

      if (fields.length) {
        fields.each(function () {
          result.push(this.getAttribute("name"));
        });
      }

      return result;
    };
    /*utils (public part) end*/



    /*Vue.js (public part)*/
    SiteApi.prototype.VUE = VUE;
    /*Vue.js (public part) end*/


    /*load page*/
    SiteApi.prototype.loadingPage = function() {
      const $body = $('body');

      setTimeout(() => {
        $body.toggleClass('loading')
      }, 500);
      setTimeout(() => {
        $body.toggleClass('load')
      }, 2500);
    };

    SiteApi.prototype.loadedPage = function() {
      const $body = $('body');

      setTimeout(() => {
        $body.removeClass('loading load');
      }, 3000);
      $body.addClass('page-loaded');
    };

    /*load page end*/

    SiteApi.prototype.ajaxHook = _ajaxHook;

    return SiteApi;
  })();

  win.SiteApi = new SiteApi();

}(window, jQuery));
