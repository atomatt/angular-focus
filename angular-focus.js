/*
 * DOM focus handling for AngularJS.
 *
 * Provides directives to annotate important bits of the application that can
 * be focussed and a service to track and move the current focus.
 */

var module = angular.module("focus", []);

module.factory("focus", function($rootScope, $rootElement, $timeout) {

    var currentFocus = null;    // Currently focussed element.
    var currentTarget = null;   // Currently selected target.

    // Move the focus to the named target.
    var focus = function(target) {
        $timeout(function() {
            if (target) {
                if (currentTarget !== target) {
                    var e = $rootElement[0].getElementsByClassName("focus-target-" + btoa(target))[0];
                    var focusTarget = angular.element(e).controller("focusTarget");
                    (focusTarget.initialFocus() || e).focus();
                }
            } else {
                if (currentTarget) {
                    currentFocus.blur();
                }
            }
        });
    };

    // Update the current target and notify any listeners.
    var setCurrentTarget = function(target) {
        if (target === currentTarget) {
            return;
        }
        currentTarget = target;
        $rootScope.$broadcast("focus:target", currentTarget);
    };

    // Watch the entire DOM for focus changes.
    $rootElement[0].addEventListener("focus", function(ev) {
        var focusTarget = angular.element(ev.target).controller("focusTarget");
        currentFocus = ev.target;
        setCurrentTarget(focusTarget ? focusTarget.name() : null);
    }, true);
    $rootElement[0].addEventListener("blur", function(ev) {
        // Clear current focus. If the focus is still cleared when the
        // timeout fires then nothing has focus now.
        currentFocus = null;
        $timeout(function() {
            if (!currentFocus) {
                setCurrentTarget(null);
            }
        });
    }, true);

    return {
        target: function(name) {
            if (name === undefined) {
                return currentTarget;
            }
            focus(name);
        }
    };
});

module.controller("focusTargetCtrl", function() {
    var name = null;
    var initialFocus = null;

    this.name = function(n) {
        if (!n) {
            return name;
        }
        name = n;
    };

    this.initialFocus = function(element) {
        if (!element) {
            return initialFocus;
        }
        initialFocus = element;
    };
});

module.directive("focusTarget", function($log) {
    return {
        controller: "focusTargetCtrl",
        link: function(scope, element, attrs, controller) {
            controller.name(scope.$eval(attrs["focusTarget"]));
            element.addClass("focus-target-" + btoa(controller.name()));
        }
    };
});

module.directive("focusInitial", function($log) {
    return {
        require: "^focusTarget",
        link: function(scope, element, attrs, focusTargetCtrl) {
            focusTargetCtrl.initialFocus(element[0]);
        }
    }
});
