webpackJsonpac__name_([2],{

/***/ "./src/app/+barrel/barrel.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"a\", function() { return BarrelComponent; });\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_tslib__ = __webpack_require__(\"./node_modules/tslib/tslib.es6.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(\"./node_modules/@angular/core/esm5/core.js\");\n\r\n\r\n/**\r\n * We're loading this component asynchronously\r\n * We are using some magic with es6-promise-loader that will wrap the module with a Promise\r\n * see https://github.com/gdi2290/es6-promise-loader for more info\r\n */\r\nconsole.log('`Barrel` component loaded asynchronously');\r\nvar BarrelComponent = /** @class */ (function () {\r\n    function BarrelComponent() {\r\n    }\r\n    BarrelComponent.prototype.ngOnInit = function () {\r\n        console.log('hello `Barrel` component');\r\n    };\r\n    BarrelComponent = __WEBPACK_IMPORTED_MODULE_0_tslib__[\"b\" /* __decorate */]([\r\n        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__[\"n\" /* Component */])({\r\n            selector: 'barrel',\r\n            template: \"\\n    <h1>Hello from Barrel</h1>\\n    <span>\\n      <a [routerLink]=\\\" ['./child-barrel'] \\\">\\n        Child Barrel\\n      </a>\\n    </span>\\n    <router-outlet></router-outlet>\\n  \",\r\n        })\r\n    ], BarrelComponent);\r\n    return BarrelComponent;\r\n}());\r\n\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vc3JjL2FwcC8rYmFycmVsL2JhcnJlbC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUd1QjtBQUN2Qjs7OztHQUlHO0FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO0FBY3hEO0lBQUE7SUFNQSxDQUFDO0lBSlEsa0NBQVEsR0FBZjtRQUNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBSlUsZUFBZTtRQVozQix3RUFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLHVMQVFUO1NBQ0YsQ0FBQztPQUNXLGVBQWUsQ0FNM0I7SUFBRCxzQkFBQztDQUFBO0FBTjJCIiwiZmlsZSI6Ii4vc3JjL2FwcC8rYmFycmVsL2JhcnJlbC5jb21wb25lbnQudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIENvbXBvbmVudCxcclxuICBPbkluaXQsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbi8qKlxyXG4gKiBXZSdyZSBsb2FkaW5nIHRoaXMgY29tcG9uZW50IGFzeW5jaHJvbm91c2x5XHJcbiAqIFdlIGFyZSB1c2luZyBzb21lIG1hZ2ljIHdpdGggZXM2LXByb21pc2UtbG9hZGVyIHRoYXQgd2lsbCB3cmFwIHRoZSBtb2R1bGUgd2l0aCBhIFByb21pc2VcclxuICogc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nZGkyMjkwL2VzNi1wcm9taXNlLWxvYWRlciBmb3IgbW9yZSBpbmZvXHJcbiAqL1xyXG5cclxuY29uc29sZS5sb2coJ2BCYXJyZWxgIGNvbXBvbmVudCBsb2FkZWQgYXN5bmNocm9ub3VzbHknKTtcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnYmFycmVsJyxcclxuICB0ZW1wbGF0ZTogYFxyXG4gICAgPGgxPkhlbGxvIGZyb20gQmFycmVsPC9oMT5cclxuICAgIDxzcGFuPlxyXG4gICAgICA8YSBbcm91dGVyTGlua109XCIgWycuL2NoaWxkLWJhcnJlbCddIFwiPlxyXG4gICAgICAgIENoaWxkIEJhcnJlbFxyXG4gICAgICA8L2E+XHJcbiAgICA8L3NwYW4+XHJcbiAgICA8cm91dGVyLW91dGxldD48L3JvdXRlci1vdXRsZXQ+XHJcbiAgYCxcclxufSlcclxuZXhwb3J0IGNsYXNzIEJhcnJlbENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpIHtcclxuICAgIGNvbnNvbGUubG9nKCdoZWxsbyBgQmFycmVsYCBjb21wb25lbnQnKTtcclxuICB9XHJcblxyXG59XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcHAvK2JhcnJlbC9iYXJyZWwuY29tcG9uZW50LnRzIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vLyJ9\n//# sourceURL=webpack-internal:///./src/app/+barrel/barrel.component.ts\n");

/***/ }),

/***/ "./src/app/+barrel/barrel.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("Object.defineProperty(__webpack_exports__, \"__esModule\", { value: true });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"BarrelModule\", function() { return BarrelModule; });\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_tslib__ = __webpack_require__(\"./node_modules/tslib/tslib.es6.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__(\"./node_modules/@angular/common/esm5/common.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__(\"./node_modules/@angular/forms/esm5/forms.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_core__ = __webpack_require__(\"./node_modules/@angular/core/esm5/core.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_router__ = __webpack_require__(\"./node_modules/@angular/router/esm5/router.js\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__barrel_routes__ = __webpack_require__(\"./src/app/+barrel/barrel.routes.ts\");\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__barrel_component__ = __webpack_require__(\"./src/app/+barrel/barrel.component.ts\");\n\r\n\r\n\r\n\r\n\r\n\r\n\r\nconsole.log('`Barrel` bundle loaded asynchronously');\r\nvar BarrelModule = /** @class */ (function () {\r\n    function BarrelModule() {\r\n    }\r\n    BarrelModule.routes = __WEBPACK_IMPORTED_MODULE_5__barrel_routes__[\"a\" /* routes */];\r\n    BarrelModule = __WEBPACK_IMPORTED_MODULE_0_tslib__[\"b\" /* __decorate */]([\r\n        Object(__WEBPACK_IMPORTED_MODULE_3__angular_core__[\"I\" /* NgModule */])({\r\n            declarations: [\r\n                /**\r\n                 * Components / Directives/ Pipes\r\n                 */\r\n                __WEBPACK_IMPORTED_MODULE_6__barrel_component__[\"a\" /* BarrelComponent */],\r\n            ],\r\n            imports: [\r\n                __WEBPACK_IMPORTED_MODULE_1__angular_common__[\"b\" /* CommonModule */],\r\n                __WEBPACK_IMPORTED_MODULE_2__angular_forms__[\"a\" /* FormsModule */],\r\n                __WEBPACK_IMPORTED_MODULE_4__angular_router__[\"c\" /* RouterModule */].forChild(__WEBPACK_IMPORTED_MODULE_5__barrel_routes__[\"a\" /* routes */]),\r\n            ],\r\n        })\r\n    ], BarrelModule);\r\n    return BarrelModule;\r\n}());\r\n\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vc3JjL2FwcC8rYmFycmVsL2JhcnJlbC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUErQztBQUNGO0FBQ0o7QUFDTTtBQUVOO0FBQ1k7QUFFckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0FBZXJEO0lBQUE7SUFFQSxDQUFDO0lBRGUsbUJBQU0sR0FBRyw4REFBTSxDQUFDO0lBRG5CLFlBQVk7UUFieEIsdUVBQVEsQ0FBQztZQUNSLFlBQVksRUFBRTtnQkFDWjs7bUJBRUc7Z0JBQ0gsMEVBQWU7YUFDaEI7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AscUVBQVk7Z0JBQ1osbUVBQVc7Z0JBQ1gscUVBQVksQ0FBQyxRQUFRLENBQUMsOERBQU0sQ0FBQzthQUM5QjtTQUNGLENBQUM7T0FDVyxZQUFZLENBRXhCO0lBQUQsbUJBQUM7Q0FBQTtBQUZ3QiIsImZpbGUiOiIuL3NyYy9hcHAvK2JhcnJlbC9iYXJyZWwubW9kdWxlLnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuaW1wb3J0IHsgRm9ybXNNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IFJvdXRlck1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XHJcblxyXG5pbXBvcnQgeyByb3V0ZXMgfSBmcm9tICcuL2JhcnJlbC5yb3V0ZXMnO1xyXG5pbXBvcnQgeyBCYXJyZWxDb21wb25lbnQgfSBmcm9tICcuL2JhcnJlbC5jb21wb25lbnQnO1xyXG5cclxuY29uc29sZS5sb2coJ2BCYXJyZWxgIGJ1bmRsZSBsb2FkZWQgYXN5bmNocm9ub3VzbHknKTtcclxuXHJcbkBOZ01vZHVsZSh7XHJcbiAgZGVjbGFyYXRpb25zOiBbXHJcbiAgICAvKipcclxuICAgICAqIENvbXBvbmVudHMgLyBEaXJlY3RpdmVzLyBQaXBlc1xyXG4gICAgICovXHJcbiAgICBCYXJyZWxDb21wb25lbnQsXHJcbiAgXSxcclxuICBpbXBvcnRzOiBbXHJcbiAgICBDb21tb25Nb2R1bGUsXHJcbiAgICBGb3Jtc01vZHVsZSxcclxuICAgIFJvdXRlck1vZHVsZS5mb3JDaGlsZChyb3V0ZXMpLFxyXG4gIF0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBCYXJyZWxNb2R1bGUge1xyXG4gIHB1YmxpYyBzdGF0aWMgcm91dGVzID0gcm91dGVzO1xyXG59XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcHAvK2JhcnJlbC9iYXJyZWwubW9kdWxlLnRzIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vLyJ9\n//# sourceURL=webpack-internal:///./src/app/+barrel/barrel.module.ts\n");

/***/ }),

/***/ "./src/app/+barrel/barrel.routes.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"a\", function() { return routes; });\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__barrel_component__ = __webpack_require__(\"./src/app/+barrel/barrel.component.ts\");\n\r\nvar routes = [\r\n    { path: '', children: [\r\n            { path: '', component: __WEBPACK_IMPORTED_MODULE_0__barrel_component__[\"a\" /* BarrelComponent */] },\r\n            { path: 'child-barrel', loadChildren: './+child-barrel#ChildBarrelModule' }\r\n        ] },\r\n];\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vc3JjL2FwcC8rYmFycmVsL2JhcnJlbC5yb3V0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBcUQ7QUFFOUMsSUFBTSxNQUFNLEdBQUc7SUFDcEIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRTtZQUNwQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLDBFQUFlLEVBQUU7WUFDeEMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxtQ0FBbUMsRUFBRTtTQUM1RSxFQUFDO0NBQ0gsQ0FBQyIsImZpbGUiOiIuL3NyYy9hcHAvK2JhcnJlbC9iYXJyZWwucm91dGVzLnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFycmVsQ29tcG9uZW50IH0gZnJvbSAnLi9iYXJyZWwuY29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBjb25zdCByb3V0ZXMgPSBbXHJcbiAgeyBwYXRoOiAnJywgY2hpbGRyZW46IFtcclxuICAgIHsgcGF0aDogJycsIGNvbXBvbmVudDogQmFycmVsQ29tcG9uZW50IH0sXHJcbiAgICB7IHBhdGg6ICdjaGlsZC1iYXJyZWwnLCBsb2FkQ2hpbGRyZW46ICcuLytjaGlsZC1iYXJyZWwjQ2hpbGRCYXJyZWxNb2R1bGUnIH1cclxuICBdfSxcclxuXTtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FwcC8rYmFycmVsL2JhcnJlbC5yb3V0ZXMudHMiXSwic291cmNlUm9vdCI6IndlYnBhY2s6Ly8vIn0=\n//# sourceURL=webpack-internal:///./src/app/+barrel/barrel.routes.ts\n");

/***/ })

});