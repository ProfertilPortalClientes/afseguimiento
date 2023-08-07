sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library"
], function (Controller, UIComponent, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("profertil.afeseguimiento.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getManifestModel: function (sName) {
            return this.getOwnerComponent().getModel(sName);
        },

        getDMSUrl: function (sPath) {
            var sComponent = this.getOwnerComponent().getManifest()["sap.app"]["id"]
            return jQuery.sap.getModulePath(sComponent) + sPath;
        },

        getDataRepo: function (path) {
            var url = this.getDMSUrl("/SDM_API/browser");
            var fullUrl = path ? url + "/" + path : url;
            return $.get({
                url: fullUrl
            });
        },

        uploadSingleFile: function (file, filename, path) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "createDocument",
                "propertyId[0]": "cmis:name",
                "propertyId[1]": "cmis:objectTypeId",
                "propertyValue[0]": filename,
                "propertyValue[1]": "cmis:document",
                "media": file,
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            $.ajax({
                url: this.getManifestModel("adjuntosModel").getProperty("/url") + path,
                type: "POST",
                data: data,
                contentType: false,
                processData: false,
                success: function (oData, oResponse) {
                    return true;
                },
                error: function (oResponse) {
                    return false;
                }
            });
        },

        uploadSingleFilePromise: function (file, filename, path) {
            var that = this;
            return new Promise(
                function (resolve, reject) {
                    var data = new FormData();
                    var dataObject = {
                        "cmisaction": "createDocument",
                        "propertyId[0]": "cmis:name",
                        "propertyId[1]": "cmis:objectTypeId",
                        "propertyValue[0]": filename,
                        "propertyValue[1]": "cmis:document",
                        "media": file,
                    };

                    var keys = Object.keys(dataObject);

                    for (var key of keys) {
                        data.append(key, dataObject[key]);
                    }

                    $.ajax({
                        url: that.getManifestModel("adjuntosModel").getProperty("/url") + path,
                        type: "POST",
                        data: data,
                        contentType: false,
                        processData: false,
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });
        },

        createFolder: function (foldername) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "createFolder",
                "propertyId[0]": "cmis:name",
                "propertyId[1]": "cmis:objectTypeId",
                "propertyValue[0]": foldername,
                "propertyValue[1]": "cmis:folder"
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            return $.ajax({
                url: this.getManifestModel("adjuntosModel").getProperty("/url"),
                type: "POST",
                data: data,
                contentType: false,
                processData: false,
                success: function (oData, oResponse) {
                    debugger;
                },
                error: function (oResponse) {
                    sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador");
                }
            });
        },

        getDMSUrl: function (sPath) {
            var sComponent = this.getOwnerComponent().getManifest()["sap.app"]["id"]
            return jQuery.sap.getModulePath(sComponent) + sPath;
        },

        getAFEFolder: function (afe) {
            return this.createFolder(afe);
        },

        getObjectId: function (oJsonFolders, sValue) {
            for (var i = 0; i < oJsonFolders.objects.length; i++) {
                var oFolder = {};
                oFolder = oJsonFolders.objects[i].object.properties;
                if (oFolder["cmis:name"].value === sValue) {
                    return oFolder["cmis:objectId"].value;
                }
            }
            return "";
        }

    });

});