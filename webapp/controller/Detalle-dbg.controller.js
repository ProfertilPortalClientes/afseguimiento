sap.ui.define([
    "./BaseController",
    "sap/ui/core/routing/History",
    "profertil/afeseguimiento/model/models",
    "profertil/afeseguimiento/model/formatter"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, History, models, formatter) {
        "use strict";
        var that;
        return BaseController.extend("profertil.afeseguimiento.controller.Detalle", {
            formatter: formatter,

            onInit: function () {

                that = this;

                that.oGlobalBusyDialog = new sap.m.BusyDialog();

                // setear modelo que guarda los datos para la creación de la AFE
                this.getOwnerComponent().setModel(models.createAFEModel(), "AFEModel");

                // inicializar vista
                sap.ui.core.UIComponent.getRouterFor(this).getRoute("Detalle").attachPatternMatched(this._onObjectMatched, this);

                // setear modo visualización             
                (this.getOwnerComponent().getModel("appModel")) ? this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "visualizacion") : this.getOwnerComponent().setModel(models.createAppModel("visualizacion"), "appModel");


            },

            _onObjectMatched: function (oEvent) {
                this.AFE = oEvent.getParameter("arguments").AFE;
                this.getView().getModel().metadataLoaded().then(function () {
                    var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionSet", {
                        AFE: that.AFE
                    });
                    this.getAFE(sPath);
                    this.getAFEAdjuntos(that.AFE);
                }.bind(this));
            },

            getAFE: function (sPath) {

                that.oGlobalBusyDialog.setText("Obteniendo AFE. Aguarde por favor");
                that.oGlobalBusyDialog.open();

                // leer AFE	
                this.getOwnerComponent().getModel().read(sPath, {
                    success: function (oData, oResponse) {
                        that.oGlobalBusyDialog.close();
                        var oAFE = oData;
                        this.getOwnerComponent().getModel("AFEModel").setData(oAFE);
                    }.bind(this),
                    error: function (oError) {
                        that.oGlobalBusyDialog.close();
                    }.bind(this)
                });

            },

            handleNavBack: function (oEvent) {
                var oRouter = that.getOwnerComponent().getRouter();
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();
                if (sPreviousHash !== undefined) {
                    // The history contains a previous entry
                    history.go(-1);
                } else {
                    // Otherwise we go backwards with a forward history
                    var bReplace = true;
                    oRouter.navTo("Principal", {}, bReplace);
                }
            },

            getAFEAdjuntos: function (psAFE) {
                var aAdjuntos = [];
                var oModel = this.getManifestModel("adjuntosModel");
                var oData = oModel.getData();
                var sUrlFolder = oData.repoId + "/root" + "/" + psAFE;
                var that = this;
                this.getDataRepo(sUrlFolder)
                    .then(response => {
                        aAdjuntos = that.getAdjuntos(response);
                        if (aAdjuntos.length === 0) {
                            aAdjuntos = [{ "filename": "No se encontraron Adjuntos", "url": "", "objectId": "" }];
                        }
                        that.getOwnerComponent().getModel("AFEModel").setProperty("/Adjuntos", aAdjuntos);
                    }).catch(oError => {
                        aAdjuntos = [{ "filename": "No se encontraron Adjuntos", "url": "", "objectId": "" }];
                        that.getManifestModel("adjuntosModel").setProperty("/adjuntos", aAdjuntos);
                    });
            },

            getAdjuntos: function (oResponse) {
                var aAdjuntos = [];
                for (var i = 0; i < oResponse.objects.length; i++) {
                    var oFolderContent = {};
                    oFolderContent = oResponse.objects[i].object.properties;
                    var oAdjunto = {};
                    oAdjunto = this.getAdjuntoProperties(oFolderContent);
                    aAdjuntos.push(oAdjunto);
                }
                return aAdjuntos;
            },

            getAdjuntoProperties: function (oFolderContent) {
                var oAdjunto = {};
                oAdjunto.objectId = oFolderContent["cmis:objectId"].value;
                oAdjunto.filename = oFolderContent["cmis:name"].value;
                oAdjunto.url = this.getDMSUrl("/SDM_API/browser") + "/" + this.getManifestModel("adjuntosModel").getData().repoId + "/root" + "?objectId=" + oAdjunto.objectId + "&cmisSelector=content&download=attachment&filename=" + oAdjunto.filename;
                return oAdjunto;

            },

            handleDescargarAdjunto: function (oEvent) {
                var sUrl = oEvent.getSource().getBindingContext("AFEModel").getProperty("url");
                if (sUrl !== "") {
                    window.open(sUrl, "_self");
                }    
            },
    
            navigateWithParameters: function (sRepoId, sFolderId) {            
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation"); 
                    oCrossAppNav.toExternal({
                        target : { "semanticObject" : "reclrepo", "action" : "display" },
                        params : { "repoId" : sRepoId, "objectId": sFolderId }
                    })
                }
            },

            getObjectId: function (oJsonFolders, sValue) {            
                for(var i=0; i < oJsonFolders.objects.length; i++) {
                    var oFolder = {};
                    oFolder = oJsonFolders.objects[i].object.properties;
                    if (oFolder["cmis:name"].value === sValue) {
                        return oFolder["cmis:objectId"].value;
                    }
                }
                return "";  
            },

            handleDescomposicionGastoPress: function (oEvent) {
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto1Enabled", false);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto2Enabled", false);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto3Enabled", false);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto4Enabled", false);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto5Enabled", false);
                this.getDialogDescomposicionGasto().open();
            },

            getDialogDescomposicionGasto: function () {
                if (!this.oDialogDescomposicionGasto) {
                    this.oDialogDescomposicionGasto = sap.ui.xmlfragment("profertil.afeseguimiento.view.fragments.DescomposicionGasto", this);
                    this.getView().addDependent(this.oDialogDescomposicionGasto);
                }
                return this.oDialogDescomposicionGasto;
            },

            handleCloseDescomposicionGastoPress: function (oEvent) {
                this.getDialogDescomposicionGasto().close();
            }

        });
    });
