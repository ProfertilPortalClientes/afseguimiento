sap.ui.define([
    "./BaseController",
    "profertil/afeseguimiento/model/models",
    "profertil/afeseguimiento/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, models, formatter, Filter, FilterOperator) {
        "use strict";
        var that;
        return BaseController.extend("profertil.afeseguimiento.controller.Principal", {
            formatter: formatter,

            onInit: function () {

                // obtener información usuario logueado
                // var promiseUser = this.getDataUsuario();

                that = this;

                that.oGlobalBusyDialog = new sap.m.BusyDialog();

                // setear el modelo a la vista
                this.getView().setModel(this.getOwnerComponent().getModel());

                // modelo para textos
                that.oTextos = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                // setear modelo que guarda los datos globales de la app
                this.getOwnerComponent().setModel(models.createAppModel(""), "appModel");

                // setear modelo que guarda los datos del seguimiento de AFEs
                this.getOwnerComponent().setModel(models.createSeguimientoModel(), "seguimientoModel");

                // setear modelo que guarda los datos de los estados del Workflow
                this.getOwnerComponent().setModel(models.createWorkflowModel(), "workflowModel");

                // setear modelo que guarda las lanes para los estados del Workflow 
                this.getOwnerComponent().setModel(models.createLanesModel(), "lanesModel");

                // setear modelo que guarda los estados de las AFES
                this.getOwnerComponent().setModel(models.createEstadosModel(), "estadosModel");

                // setear modelo que guarda los usuarios de las AFES
                this.getOwnerComponent().setModel(models.createUsuariosModel(), "usuariosModel");

                // setear modelo que guarda las imputaciones
                this.getOwnerComponent().setModel(models.createImputacionesModel(), "imputacionesModel");

                // setear modelo que guarda los filtros
                this.getOwnerComponent().setModel(models.createFiltrosModel(), "filtrosModel");

                // setear modelo que guarda los datos del usuario logueado
                this.getOwnerComponent().setModel(models.createLoginModel(), "loginModel");

                // obtener URL repositorio de adjuntos
                this.setRepoURLAdjuntos();

                // obtener imputaciones para los filtros
                this.getValueHelpImputacion();

                // promiseUser.then(sap.ui.core.UIComponent.getRouterFor(this).getRoute("Principal").attachPatternMatched(this._onObjectMatched, this));
                // inicializar vista
                sap.ui.core.UIComponent.getRouterFor(this).getRoute("Principal").attachPatternMatched(this._onObjectMatched, this);

            },

            _onObjectMatched: function (oEvent) {
                this.getView().getModel().metadataLoaded().then(function () {
                    this.getData();
                }.bind(this));
            },

            handleGetSeguimientoAFES: function (oEvent) {
                this.getData();
            },

            getValueHelpImputacion: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpImputacionSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("imputacionesModel").setProperty("/Imputaciones", oData.results);
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            getData: function () {
                var aPromises = [];
                aPromises.push(this.getSeguimientoAFES());
                aPromises.push(this.getMatchcodeUsuariosData());
                aPromises.push(this.getDataUsuario());
                that.oGlobalBusyDialog.setText(that.oTextos.getText("PrincipalTablaAFEBusy.text"));
                that.oGlobalBusyDialog.open();
                Promise.all(aPromises).then(that.onSuccessData.bind(that), that.onErrorData.bind(that));
            },

            onSuccessData: function (paResultados) {
                that.oGlobalBusyDialog.close();
                var aOrdenes = (paResultados[0].results.length > 0) ? paResultados[0].results : [];
                var aUsuarios = (paResultados[1].results.length > 0) ? paResultados[1].results : [];
                aOrdenes.forEach(function (orden) {
                    if (orden.MontoSolicitado <= 500000) {
                        orden.Flujo = 1; // Gerente área
                    } else if (orden.MontoSolicitado > 500000 && orden.MontoSolicitado <= 1000000) {
                        orden.Flujo = 2; // Gerente área + Gerente AyF                        
                    } else if (orden.MontoSolicitado > 1000000) {
                        orden.Flujo = 3; // Gerente área + Gerente AyF + Gerente General                        
                    }
                    that.checkBorrador(orden);
                });
                that.ordenesVisibles(aOrdenes);
                aOrdenes.sort((a,b) => { return b.AFE - a.AFE});
                //ACA sacar de aOrdenes registros que tengan isBorrador = true y no tengan el mismo usuario creador.
                that.getOwnerComponent().getModel("seguimientoModel").setProperty("/Historial", aOrdenes);
                that.getOwnerComponent().getModel("usuariosModel").setProperty("/Usuarios", aUsuarios);
            },

            ordenesVisibles: function(aOrdenes) {
                var arrIndex = [];
                for(var i = 0; i < aOrdenes.length; i++) {
                    if (!aOrdenes[i].isVisible) {
                        arrIndex.push(i);
                    }
                }
                arrIndex.sort((a,b) => { return b - a});
                for(var i = 0; i < arrIndex.length; i++){
                    aOrdenes.splice(arrIndex[i],1)
                }
            },

            onErrorData: function (poError) {
                that.oGlobalBusyDialog.close();
            },

            getSeguimientoAFES: function () {
                return new Promise(
                    function (resolve, reject) {
                        var sFechaDesde = that.getOwnerComponent().getModel("filtrosModel").getProperty("/FechaDesde");
                        var sFechaHasta = that.getOwnerComponent().getModel("filtrosModel").getProperty("/FechaHasta");
                        var sAFE = that.getOwnerComponent().getModel("filtrosModel").getProperty("/AFE");
                        var sTitulo = that.getOwnerComponent().getModel("filtrosModel").getProperty("/Titulo");
                        var sTipoImputacion = that.getOwnerComponent().getModel("filtrosModel").getProperty("/Imputacion");
                        //var aEstados = that.getOwnerComponent().getModel("filtrosModel").getProperty("/Estados");
                        //var aUsuarios = that.getOwnerComponent().getModel("filtrosModel").getProperty("/Usuarios");
                        var sMontoPresupuestadoDesde = that.getOwnerComponent().getModel("filtrosModel").getProperty("/MontoPresupuestadoDesde") || "0";
                        var sMontoPresupuestadoHasta = that.getOwnerComponent().getModel("filtrosModel").getProperty("/MontoPresupuestadoHasta") || "999999999";
                        var sMontoSolicitadoDesde = that.getOwnerComponent().getModel("filtrosModel").getProperty("/MontoSolicitadoDesde") || "0";
                        var sMontoSolicitadoHasta = that.getOwnerComponent().getModel("filtrosModel").getProperty("/MontoSolicitadoHasta") || "999999999";
                        var aFilters = [];
                        aFilters.push(new Filter("FechaEmision", FilterOperator.BT, sFechaDesde, sFechaHasta));
                        if (sAFE) {
                            aFilters.push(new Filter("AFE", FilterOperator.Contains, sAFE));
                        }
                        if (sTitulo) {
                            aFilters.push(new Filter("Titulo", FilterOperator.Contains, sTitulo));
                        }
                        if (sTipoImputacion) {
                            aFilters.push(new Filter("ImputadoA", FilterOperator.EQ, sTipoImputacion));
                        }

                        aFilters.push(new Filter("MontoPresupuestado", FilterOperator.BT, sMontoPresupuestadoDesde, sMontoPresupuestadoHasta));
                        aFilters.push(new Filter("MontoSolicitado", FilterOperator.BT, sMontoSolicitadoDesde, sMontoSolicitadoHasta));

                        //aEstados = aEstados.length > 0 ? aEstados : [];
                        //aUsuarios = aUsuarios.length > 0 ? aUsuarios : [];

                        // aEstados.forEach(function (item) {
                        //     aFilters.push(new Filter("Estado", FilterOperator.EQ, item));
                        // });

                        // aUsuarios.forEach(function (item) {
                        //     aFilters.push(new Filter("Creador", FilterOperator.EQ, item));
                        // });

                        // leer seguimiento historial			
                        that.getOwnerComponent().getModel().read("/OrdenInversionSet", {
                            filters: aFilters,
                            success: function (oData, oResponse) {
                                resolve(oData);
                            }.bind(that),
                            error: function (oError) {
                                reject(oError);
                            }.bind(that)
                        });
                    });

            },

            getMatchcodeUsuariosData: function () {
                return new Promise(
                    function (resolve, reject) {
                        that.getOwnerComponent().getModel().read("/ValueHelpUsuarioSet", {
                            success: function (oData, oResponse) {
                                resolve(oData);
                            }.bind(that),
                            error: function (oError) {
                                reject(oError);
                            }.bind(that)
                        });
                    });
            },

            getDataUsuario: function () {
                return new Promise(
                    function(resolve,reject) {
                        var sUsuario = "";
                        that.getOwnerComponent().getModel().read("/DatosUsuarioSet('" + sUsuario + "')", {
                            success: function (oData, oResponse) {
                                resolve(oData);
                                that.getOwnerComponent().getModel("loginModel").setProperty("/DatosUsuario", oData);
                            }.bind(that),
                            error: function (oError) {
                                reject(oError);
                            }.bind(that)
                        });
                    });
                // var sUsuario = "";
                // this.getOwnerComponent().getModel().read("/DatosUsuarioSet('" + sUsuario + "')", {
                //     success: function (oData, oResponse) {
                //         that.getOwnerComponent().getModel("loginModel").setProperty("/DatosUsuario", oData);
                //     }.bind(this),
                //     error: function (oError) {
                //     }.bind(this)
                // });
            },

            handleCreacionAFEPress: function (oEvent) {
                this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "creacion");
                var oRouter = that.getOwnerComponent().getRouter();
                oRouter.navTo("Creacion");
            },

            handleDetalleAFEPress: function (oEvent) {
                this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "visualizacion");
                var oAFE = oEvent.getSource().getBindingContext("seguimientoModel").getObject();
                var oRouter = that.getOwnerComponent().getRouter();
                oRouter.navTo("Detalle", {
                    AFE: oAFE.AFE
                });
            },

            handleGetEstadosWorkflowAFE: async function (oEvent) {
                debugger;
                var oAFE = oEvent.getSource().getBindingContext("seguimientoModel").getObject();

                // inicializar modelo workflow
                that.getOwnerComponent().setModel(models.createWorkflowModel(), "workflowModel");
                that.oGlobalBusyDialog.setText("Obteniendo información y generando el flujo de estados");
                that.oGlobalBusyDialog.open();
                try {
                    var oDatosEstadosResponse = await this.getEstadosWorkflowAFE(oAFE.AFE);
                    var aDatosEstados = (oDatosEstadosResponse.results.length > 0) ? oDatosEstadosResponse.results : [];
                    that.oGlobalBusyDialog.close();

                    // obtener las lanes                    
                    var aLanes = that.getLanes(oAFE.AFE);

                    // obtener los nodos
                    var aNodes = that.getNodes(aDatosEstados);

                    // setear las lanes
                    that.getOwnerComponent().getModel("workflowModel").setProperty("/Informacion/lanes", aLanes);

                    // setear los nodos
                    that.getOwnerComponent().getModel("workflowModel").setProperty("/Informacion/nodes", aNodes);

                    // setear AFE para el título
                    that.getOwnerComponent().getModel("appModel").setProperty("/AFE", oAFE.AFE);

                    this.oDialogoSeleccionWorkflow = sap.ui.xmlfragment(
                        "profertil.afeseguimiento.view.fragments.DialogoVisualizacionWorkflow", this);
                    this.getView().addDependent(this.oDialogoSeleccionWorkflow);
                    //sap.ui.getCore().byId("processflow1").zoomIn();
                    this.oDialogoSeleccionWorkflow.open();
                } catch (error) {
                    that.oGlobalBusyDialog.close();
                }
            },

            getLanes: function (sAFE) {
                var aDatos = that.getOwnerComponent().getModel("seguimientoModel").getProperty("/Historial");
                var aDatosAFE = aDatos.filter(function (datos) { return datos.AFE === sAFE; });
                var oAFE = (aDatosAFE.length >= 1) ? aDatosAFE[0] : {};
                var aLanes = [];
                if (oAFE && oAFE.MontoSolicitado <= 500000) {
                    aLanes = that.getOwnerComponent().getModel("lanesModel").getProperty("/Flujo1");
                } else if (oAFE && oAFE.MontoSolicitado > 500000 && oAFE.MontoSolicitado <= 1000000) {
                    aLanes = that.getOwnerComponent().getModel("lanesModel").getProperty("/Flujo2");
                } else if (oAFE && oAFE.MontoSolicitado > 1000000) {
                    aLanes = that.getOwnerComponent().getModel("lanesModel").getProperty("/Flujo3");
                }
                return aLanes;
            },

            getNodes: function (aDatosEstados) {
                var aNodes = [];
                aDatosEstados.forEach(function (estado, sIndex) {
                    var aChilds = [],
                        sColorScheme = 8,
                        bStatus = "Positive",
                        sIcon = "sap-icon://accept",
                        sStateText = "Aprobado";
                    if (estado.EstadoActual > estado.EstadoAnterior) {
                        switch (estado.EstadoActual) {
                            case "8": // Aprobado                                
                                break;
                            case "9": // Rechazado
                                sColorScheme = 2;
                                sIcon = "sap-icon://decline",
                                    bStatus = "Negative",
                                    sStateText = "Rechazado";
                                break;
                            case "10": // Cancelado
                                sColorScheme = 2;
                                sIcon = "sap-icon://decline",
                                    bStatus = "Negative",
                                    sStateText = "Cancelado";
                                break;
                            default:
                                if (aDatosEstados[sIndex + 1] && aDatosEstados[sIndex + 1].EstadoAnterior == estado.EstadoActual) {
                                    aChilds.push((sIndex + 1).toString());
                                }
                                break;
                        }
                    } else { // Devuelto a un aprobador anterior
                        sColorScheme = 2;
                        sIcon = "sap-icon://decline",
                            bStatus = "Negative",
                            sStateText = "Rechazado";
                    }
                    aNodes.push({
                        "id": String(sIndex),
                        "lane": estado.EstadoAnterior,
                        "title": estado.Responsable,
                        "nombre": estado.ResponsableNombre,
                        "fecha": estado.FechaHora,
                        "icono": sIcon,
                        "colorScheme": sColorScheme,
                        "titleAbbreviation": "AA",
                        "children": aChilds,
                        "state": bStatus,
                        "stateText": sStateText,
                        "highlighted": false,
                        "focused": true,
                        "texts": "LALALA",
                        "quickView": {}
                    });
                }.bind(this))
                return aNodes;
            },

            handleCerrarDialogoVisualizacion: function (oEvent) {
                this.oDialogoSeleccionWorkflow.close();
            },

            getEstadosWorkflowAFE: function (sAFE) {
                var sPath = that.getOwnerComponent().getModel().createKey("/OrdenInversionSet", {
                    AFE: sAFE
                });
                return new Promise(function (resolve, reject) {
                    that.getOwnerComponent().getModel().read(sPath + "/To_Historial_Estados", {
                        success: function (response) {
                            resolve(response);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });
            },

            setRepoURLAdjuntos: function () {
                var oModel = this.getManifestModel("adjuntosModel");
                this.getDataRepo("").then(response => {
                    var repos = Object.keys(response).filter(repo => response[repo].repositoryName == "AFES");
                    var root = repos[0] + "/root";
                    var url = this.getDMSUrl("/SDM_API/browser/" + root);
                    this._dmsUrl = url;
                    oModel.setProperty("/url", url);
                    oModel.setProperty("/repoId", repos[0]);
                    oModel.setProperty("/rootId", response[repos[0]].rootFolderId);
                });
            },

            ////////////////

            handleGetAFE: function (oEvent) {
                var oData = this.getManifestModel("adjuntosModel").getData();
                var sUrlFolder = oData.repoId + "/root" + "/" + "0000000001";
                var sFileName = "descarga.jpg";
                var that = this;
                this.getDataRepo(sUrlFolder)
                    .then(response => {
                        var sObjectId = that.getObjectId(response, sFileName);
                        if (sObjectId === "") {
                            that.navigateWithParameters(oData.repoId, oData.rootId);
                        } else {
                            that.navigateWithParameters(oData.repoId, sObjectId);
                        }
                    })
                    .catch(function () {
                        that.navigateWithParameters(oData.repoId, oData.rootId);
                    });
            },

            navigateWithParameters: function (sRepoId, sFolderId) {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                    oCrossAppNav.toExternal({
                        target: { "semanticObject": "reclrepo", "action": "display" },
                        params: { "repoId": sRepoId, "objectId": sFolderId }
                    })
                }
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
            },

            handleUploadAdjunto: function (client, claim) {
                var file, filename;
                var sAFE = "0000000028";
                this.getAFEFolder(sAFE)
                    .then(() => {
                        var uploadSet = this.byId("idUploader2");
                        var items = this.byId("idUploader2").getIncompleteItems();

                        var path = "/" + sAFE;

                        for (var i = 0; i < items.length; i++) {
                            file = items[i].getFileObject();
                            filename = file.name;

                            this.uploadSingleFile(file, filename, path);
                        }

                    });
            },

            onReadFile: function () {
                var oData = this.getManifestModel("adjuntosModel").getData();
                var sUrlFolder = oData.repoId + "/root" + "/0000000001";
                var sFileName = "descarga.jpg";
                var that = this;
                this.getDataRepo(sUrlFolder)
                    .then(response => {
                        var sObjectId = that.getObjectId(response, sFileName);
                        sap.m.URLHelper.redirect(sUrlFolder + "/" + sObjectId, true);
                    })
                    .catch(function () {
                        alert("ERROR");
                    });
            },

            // borrador AFE
            checkBorrador: function(orden) {
                var userLogin = this.getOwnerComponent().getModel("loginModel").getProperty("/DatosUsuario");
                let nroAFE = parseInt(orden.AFE);
                if (nroAFE > 9000000000) {
                    orden.isBorrador = true;
                    orden.notAction = false;
                    if (orden.Creador == userLogin.Usuario) {
                        orden.isVisible = true;
                    } else {
                        orden.isVisible = false;
                    }
                } else {
                    orden.isBorrador = false;
                    orden.notAction = true;
                    orden.isVisible = true;
                };
            },

            // compareByAFE: function (a, b) {
            //     return a.AFE - b.AFE;
            // },

            pressEditBorrador: function(oEvent) {
                this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "borrador");
                var oAFE = oEvent.getSource().getBindingContext("seguimientoModel").getObject();
                var oRouter = that.getOwnerComponent().getRouter();
                oRouter.navTo("Borrador", {
                    AFE: oAFE.AFE
                });
            },

            pressDeleteBorrador: function(oEvent) {
                var oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirmación",
                    content: new sap.m.Text({
                        text: "¿Está seguro que desea eliminar borrador AFE?. Se eliminaran adjuntos asociados"
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Aceptar",
                        press: function () {
                            oConfirmDialog.close();
                            that.onBorrarAFE(oEvent);
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancelar",
                        press: function () {
                            oConfirmDialog.close();
                        }.bind(this)
                    })
                });
                oConfirmDialog.open();
            },

            onBorrarAFE: function (oEvent) {
                that.oGlobalBusyDialog.setText("Eliminando borrador AFE y adjuntos");
                that.oGlobalBusyDialog.open();
                var oAFE = oEvent.getSource().getBindingContext("seguimientoModel").getObject();
                // var oAFE = this.getOwnerComponent().getModel("seguimientoModel").getData();
                var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionBorradorSet", {
                    AFE: oAFE.AFE
                });
                debugger;
                var oModel = this.getOwnerComponent().getModel();
                oModel.setUseBatch(false);
                oModel.remove(sPath, {
                    method:"DELETE",
                    success: function (oData) {
                        sap.m.MessageBox.success("Borrador AFE nro: " + oAFE.AFE + " eliminado con exito.", {
                            onClose: function (sAction) {
                                that.getDataFolder(oAFE.AFE);
                                // that.handleGetSeguimientoAFES();
                                // Eliminar adjuntos
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        that.oGlobalBusyDialog.close();
                        sap.m.MessageBox.error("Error al eliminar borrador AFE", {
                            onClose: function (sAction) {
                            }
                        });
                    }.bind(this)
                });
            },

            getDataFolder: function(psAFE) {
                debugger;
                this.getClientFolder(psAFE)
                    .catch(() => {
                        that.oGlobalBusyDialog.close();
                        that.handleGetSeguimientoAFES();
                        console.log("error lectura folder MDS");
                    })
                    .then((response) => {
                        that.getObjIdFolder(response,psAFE);
                    });
            },

            getObjIdFolder: function(oResponse,psAFE) {
                debugger;
                var oFolder = {};
                if (oResponse.objects != undefined) {
                    for (var i = 0; i < oResponse.objects.length; i++) {
                        oFolder = oResponse.objects[i].object.properties;
                        if (oFolder["cmis:name"].value == psAFE) {
                            that.getManifestModel("adjuntosModel").setProperty("/folderObjId",oFolder["cmis:objectId"].value);
                        }
                    }
                } else {
                    oFolder = oResponse.properties;
                    that.getManifestModel("adjuntosModel").setProperty("/folderObjId",oFolder["cmis:objectId"].value);
                }
                this.deleteFolderTree(psAFE);
            },

            deleteFolderTree: function(psAFE) {
                var data = new FormData();
                var objIdFolder = this.getManifestModel("adjuntosModel").getProperty("/folderObjId");
    
                var dataObject = {
                    "cmisaction": "deleteTree",
                    "objectId": objIdFolder,
                    "allVersions": false,
                    "continueOnFailure": false
                };
    
                var keys = Object.keys(dataObject);
    
                for (var key of keys) {
                    data.append(key, dataObject[key]);
                }
                debugger;
                // var urlM = this.getDMSUrl("/SDM_API/browser") + "/" + this._dmsUrl;
                return $.ajax({
                    url: this.getManifestModel("adjuntosModel").getProperty("/url"),
                    type: "POST",
                    data: data,
                    contentType: false,
                    processData: false,
                    success: function (oData, oResponse) {
                        debugger;
                        that.handleGetSeguimientoAFES();
                    },
                    error: function (oResponse) {
                        that.oGlobalBusyDialog.close();
                        debugger;
                        that.handleGetSeguimientoAFES();
                    }
                });
                },

        });
    });
