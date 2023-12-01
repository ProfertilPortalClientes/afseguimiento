sap.ui.define([
    "./BaseController",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "profertil/afeseguimiento/model/models",
    "profertil/afeseguimiento/model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, History, MessageBox, models, formatter) {
        "use strict";
        var that;
        return BaseController.extend("profertil.afeseguimiento.controller.Borrador", {
            formatter: formatter,

            onInit: function () {

                that = this;

                that.oGlobalBusyDialog = new sap.m.BusyDialog();

                // setear modelo que guarda los datos para la creación de la AFE
                this.getOwnerComponent().setModel(models.createAFEModel(), "AFEModel");

                // setear modelo que guarda los datos para los value help
                this.getOwnerComponent().setModel(models.createValueHelpModel(), "valueHelpModel");

                // seteat modelo para controlar los estados de validaciones
                this.getOwnerComponent().setModel(models.createEstadosValidacionesModel(), "estadosValidaciones");

                // inicializar vista
                sap.ui.core.UIComponent.getRouterFor(this).getRoute("Borrador").attachPatternMatched(this._onObjectMatched, this);

                // setear modo visualización             
                (this.getOwnerComponent().getModel("appModel")) ? this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "borrador") : this.getOwnerComponent().setModel(models.createAppModel("borrador"), "appModel");

                this.initDataValueHelps();
            },

            _onObjectMatched: function (oEvent) {
                this.AFE = oEvent.getParameter("arguments").AFE;
                this.getView().getModel().metadataLoaded().then(function () {
                    var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionSet", {
                        AFE: that.AFE
                    });
                    this.getAFE(sPath);
                    // this.getAFEAdjuntos(that.AFE);
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
                        // this.initDataValueHelps();
                        this.setPreviousData(oAFE);
                        this.getAFEAdjuntos(that.AFE);
                        this.getView().byId("idUploaderBorrador").setEnabled(true);
                    }.bind(this),
                    error: function (oError) {
                        that.oGlobalBusyDialog.close();
                    }.bind(this)
                });

            },

            initDataValueHelps: function () {
                this.getValueHelpResponsable();
                this.getValueHelpJefe();
                this.getValueHelpSector();
                this.getValueHelpImputacion();
                this.getValueHelpMoneda();
                this.setValueHelpPeriodos()
            },

            getValueHelpResponsable: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpResponsableSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("valueHelpModel").setProperty("/Responsables", oData.results);
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            getValueHelpJefe: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpJefeSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("valueHelpModel").setProperty("/Jefes", oData.results);
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            getValueHelpSector: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpSectorSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("valueHelpModel").setProperty("/Sectores", oData.results);
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            getValueHelpGerente: function (sResponsable) {
                    if (!sResponsable) {
                        return;
                    }
                    var sPath = this.getOwnerComponent().getModel().createKey("/DatosResponsableSet", {
                        "Responsable": sResponsable
                    });
                    this.oGlobalBusyDialog.setText("Obteniendo el gerente");
                    this.oGlobalBusyDialog.open();
                    this.getOwnerComponent().getModel().read(sPath, {
                        success: function (oData) {
                            this.oGlobalBusyDialog.close();
                            this.getOwnerComponent().getModel("AFEModel").setProperty("/Gerente", oData.Gerente);
                        }.bind(this),
                        error: function (oError) {
                            that.oGlobalBusyDialog.close();
                        }.bind(this)
                    });
            },

            getValueHelpImputacion: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpImputacionSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("valueHelpModel").setProperty("/Imputaciones", oData.results);
                        this.changeImputacion("1");
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            getValueHelpMoneda: function () {
                this.getOwnerComponent().getModel().read("/ValueHelpMonedaSet", {
                    success: function (oData) {
                        this.getOwnerComponent().getModel("valueHelpModel").setProperty("/Monedas", oData.results);
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
            },

            setValueHelpPeriodos: function () {
                var sAnio = new Date().getFullYear();
                var aPeriodos = [];
                for (let i = sAnio; i < sAnio + 10; i++) {
                    aPeriodos.push({ Periodo: i });
                }
                this.getOwnerComponent().getModel("valueHelpModel").setProperty("/PeriodosDesde", aPeriodos);
                this.getOwnerComponent().getModel("valueHelpModel").setProperty("/PeriodosHasta", aPeriodos);
            },

            handleSelectResponsable: function (oEvent) {
                var sResponsable = oEvent.getSource().getSelectedKey();
                if (sResponsable) {
                    this.getValueHelpGerente(sResponsable);
                }
            },

            handleChangeImputadoA: function (oEvent) {

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

            handleDescomposicionGastoPress: function (oEvent) {
                if (!this.validarPeriodos()) {
                    sap.m.MessageToast.show("Para cargar la descomposición de los gastos debe ingresar los períodos desde/hasta");
                    return;
                }
                if (!this.validarPeriodosDiferencia()) {
                    sap.m.MessageToast.show("Para cargar la descomposición de los gastos la diferencia de los períodos desde/hasta debe ser de máximo 5 años");
                    return;
                }
                if (!this.validarMontoSolicitado()) {
                    sap.m.MessageToast.show("Para cargar la descomposición de los gastos debe ingresar el monto solicitado");
                    return;
                }
                this.getDialogDescomposicionGasto().open();

            },

            handleCloseDescomposicionGastoPress: function (oEvent) {
                this.getDialogDescomposicionGasto().close();
            },

            getDialogDescomposicionGasto: function () {
                if (!this.oDialogDescomposicionGasto) {
                    this.oDialogDescomposicionGasto = sap.ui.xmlfragment("profertil.afeseguimiento.view.fragments.DescomposicionGasto", this);
                    this.getView().addDependent(this.oDialogDescomposicionGasto);
                }
                return this.oDialogDescomposicionGasto;
            },

            validarPeriodos: function () {
                var bValido = true;
                var sState = "None";
                var oModelEstadosValidaciones = this.getOwnerComponent().getModel("estadosValidaciones");
                var sPeriodoDesde = this.getOwnerComponent().getModel("AFEModel").getProperty("/PeriodoDesde");
                var sPeriodoHasta = this.getOwnerComponent().getModel("AFEModel").getProperty("/PeriodoHasta");
                if (!sPeriodoDesde || !sPeriodoDesde || (sPeriodoDesde > sPeriodoHasta)) {
                    bValido = false;
                    sState = "Error";
                }
                oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoDesde", sState);
                oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", sState);
                return bValido;
            },

            validarPeriodosDiferencia: function () {
                var bValido = true;
                var bDescomposicionGasto1Enabled = false;
                var bDescomposicionGasto2Enabled = false;
                var bDescomposicionGasto3Enabled = false;
                var bDescomposicionGasto4Enabled = false;
                var bDescomposicionGasto5Enabled = false;
                var sDiferencia = 0;
                var sState = "None";
                var oModelEstadosValidaciones = this.getOwnerComponent().getModel("estadosValidaciones");
                var sPeriodoDesde = this.getOwnerComponent().getModel("AFEModel").getProperty("/PeriodoDesde");
                var sPeriodoHasta = this.getOwnerComponent().getModel("AFEModel").getProperty("/PeriodoHasta");
                if (sPeriodoDesde && sPeriodoHasta && sPeriodoDesde <= sPeriodoHasta) {
                    sDiferencia = sPeriodoHasta - sPeriodoDesde;
                    if (sDiferencia > 4) {
                        bValido = false;
                        sState = "Error";
                    } else {
                        for (var i = 0; i < 5; i++) {
                            if (i <= sDiferencia) {
                                switch (i) {
                                    case 0:
                                        bDescomposicionGasto1Enabled = true;
                                        break;
                                    case 1:
                                        bDescomposicionGasto2Enabled = true;
                                        break;
                                    case 2:
                                        bDescomposicionGasto3Enabled = true;
                                        break;
                                    case 3:
                                        bDescomposicionGasto4Enabled = true;
                                        break;
                                    case 4:
                                        bDescomposicionGasto5Enabled = true;
                                        break;
                                    default:
                                        break;
                                }
                            } else {
                                switch (i) {
                                    case 0:
                                        this.getOwnerComponent().getModel("AFEModel").setProperty("/DescomposicionGasto1", 0);
                                        break;
                                    case 1:
                                        this.getOwnerComponent().getModel("AFEModel").setProperty("/DescomposicionGasto2", 0);
                                        break;
                                    case 2:
                                        this.getOwnerComponent().getModel("AFEModel").setProperty("/DescomposicionGasto3", 0);
                                        break;
                                    case 3:
                                        this.getOwnerComponent().getModel("AFEModel").setProperty("/DescomposicionGasto4", 0);
                                        break;
                                    case 4:
                                        this.getOwnerComponent().getModel("AFEModel").setProperty("/DescomposicionGasto5", 0);
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                } else {
                    bValido = false;
                    sState = "Error";
                }
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto1Enabled", bDescomposicionGasto1Enabled);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto2Enabled", bDescomposicionGasto2Enabled);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto3Enabled", bDescomposicionGasto3Enabled);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto4Enabled", bDescomposicionGasto4Enabled);
                this.getOwnerComponent().getModel("appModel").setProperty("/DescomposicionGasto5Enabled", bDescomposicionGasto5Enabled);
                oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoDesde", sState);
                oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", sState);
                return bValido;
            },

            validarMontoSolicitado: function () {
                var bValido = true;
                var sState = "None";
                var oModelEstadosValidaciones = this.getOwnerComponent().getModel("estadosValidaciones");
                var sMontoSolicitado = this.getOwnerComponent().getModel("AFEModel").getProperty("/MontoSolicitado");
                if (!sMontoSolicitado || parseFloat(sMontoSolicitado) <= 0) {
                    bValido = false;
                    sState = "Error";
                }
                oModelEstadosValidaciones.setProperty("/DatosGenerales_MontoSolicitado", sState);
                return bValido;
            },

            uploadAdjuntos: function (psAFE,afePrevia) {

                that.oGlobalBusyDialog.setText("Subiendo documentos adjuntos");
                that.oGlobalBusyDialog.open();
                // obtener lista de archivos
                var aFiles = that.getView().getModel("AFEModel").getProperty("/AdjuntosF");

                var i = 0;
                var oReader = new FileReader();
                oReader.onload = function (oFile) {
                    // agregar a array de archivos si no existe
                    aFiles[i].valor = oFile.target.result;
                };

                oReader.onloadend = function () {
                    // cuando termina una lectura, iniciar la siguiente (si hay) o finalizar
                    i++;
                    if (aFiles[i]) {
                        this.readAsDataURL(aFiles[i]);
                    } else {
                        that.agregarAdjuntos(aFiles, afePrevia);
                    }
                };

                // lectura del primer archivo (si hay) o finalizar
                if (aFiles.length > 0) {
                    oReader.readAsDataURL(aFiles[i]);
                } else {
                    that.agregarAdjuntos([], afePrevia);
                }
            },

            agregarAdjuntos: function (paFiles, psAFE) {
                var aFilesAgregados = that.getView().getModel("AFEModel").getProperty("/Adjuntos");
                if (aFilesAgregados != undefined) {
                    this.agregarAdjuntosCreados(paFiles,psAFE);
                } else {
                    this.agregarAdjuntosNuevos(paFiles,psAFE);
                }
            },

            agregarAdjuntosCreados: function(paFiles,psAFE) {
                    if (paFiles.length > 0) {
                    var aPromises = [];
                    this.getClientFolder(psAFE)
                        .catch(() => {
                            that.oGlobalBusyDialog.close();
                            sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                                onClose: function (sAction) {
                                    that.handleNavBack();
                                }
                            });
                        })
                        .then((response) => {
                            that.getObjIdFolder(response,that.AFE,psAFE);
                            var sPathFolder = "/" + psAFE;
                            for (var i = 0; i < paFiles.length; i++) {
                                var file = paFiles[i];
                                var filename = paFiles[i].name;
                                aPromises.push(this.uploadSingleFilePromise(file, filename, sPathFolder));
                            }
                            Promise.all(aPromises).then(that.onSuccessUpload.bind(that), that.onErrorUpload.bind(that));
                        });
                }
            },

            agregarAdjuntosNuevos: function(paFiles,psAFE) {
                if (paFiles.length > 0) {
                    var aPromises = [];
                    this.createFolder(psAFE)
                        .catch(() => {
                            that.oGlobalBusyDialog.close();
                            sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                                onClose: function (sAction) {
                                    that.handleNavBack();
                                }
                            });
                        })
                        .then((response) => {
                            that.getObjIdFolder(response,that.AFE,psAFE);
                            var sPathFolder = "/" + psAFE;
                            for (var i = 0; i < paFiles.length; i++) {
                                var file = paFiles[i];
                                var filename = paFiles[i].name;
                                aPromises.push(this.uploadSingleFilePromise(file, filename, sPathFolder));
                            }
                            Promise.all(aPromises).then(that.onSuccessUpload.bind(that), that.onErrorUpload.bind(that));
                        });
                }
            },

            onSuccessUpload: function (paResultados) {
                var isNewAFE = that.getManifestModel("adjuntosModel").getProperty("/isNewAFE");
                if (isNewAFE) {
                    that.renameFolder();
                } else {
                    that.oGlobalBusyDialog.close();
                    sap.m.MessageBox.success("Adjuntos subidos correctamente", {
                        onClose: function (sAction) {
                            that.handleNavBack();
                        }
                    });
                }
            },

            onErrorUpload: function (poError) {
                that.oGlobalBusyDialog.close();
                sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                    onClose: function (sAction) {
                        that.handleNavBack();
                    }
                });
            },

            handleUploadAdjunto: function (oEvent) {
                var oUploader = that.getView().byId("idUploaderBorrador");
                var aFiles = jQuery.sap.domById(oUploader.getId() + "-fu").files;
                var aFilesAgregados = that.getView().getModel("AFEModel").getProperty("/AdjuntosLocal");
                var aFilteredFiles = [];
                var sPeso = 0;
                var aAdjuntos = [];
                var aSplit = [];
                var sExtension;

                if (!aFilesAgregados) {
                    aFilesAgregados = [];
                }

                //filtrar repetidos
                for (var i = 0; i < aFiles.length; i++) {
                    var bIncluido = false,
                        k = 0;
                    while (!bIncluido && k < aFilesAgregados.length) {
                        bIncluido = (aFilesAgregados[k].name === aFiles[i].name);
                        k++;
                    }
                    if (!bIncluido) {
                        aFilteredFiles.push(aFiles[i]);
                    }
                }

                // calcular peso total: archivos nuevos + anteriores
                for (i = 0; i < aFilteredFiles.length; i++) {
                    sPeso += aFilteredFiles[i].size;
                }
                for (i = 0; i < aFilesAgregados.length; i++) {
                    sPeso += aFilesAgregados[i].size;
                }
                if (sPeso > 10 * 1024 * 1024) {
                    sap.m.MessageToast.show("Los archivos seleccionados exceden el tamaño máximo permitido");
                    return false;
                }

                aFilesAgregados = aFilesAgregados.concat(aFilteredFiles);

                for (i = 0; i < aFilesAgregados.length; i++) {
                    aSplit = aFilesAgregados[i].name.toString().split(".");
                    sExtension = aSplit[aSplit.length - 1];
                    aAdjuntos.push({
                        name: aFilesAgregados[i].name,
                        filename: aFilesAgregados[i].name,
                        Extension: sExtension
                    });
                }
                // that.getView().getModel("AFEModel").setProperty("/Adjuntos", aAdjuntos);
                that.getView().getModel("AFEModel").setProperty("/AdjuntosLocal", aAdjuntos);
                that.getView().getModel("AFEModel").setProperty("/AdjuntosF", aFilesAgregados);
                if (aFilesAgregados.length > 0) {
                    this.getView().byId("idUploaderBorrador").setEnabled(false);
                } else {
                    this.getView().byId("idUploaderBorrador").setEnabled(true);
                }
            },

            // Eliminar archivo listado
            handleEliminarAdjuntoLocal: function (oEvent) {
                var oItem = oEvent.getSource().getParent();
                var sIndex = oItem.getParent().indexOfItem(oItem);
                var aAdjuntos = that.getView().getModel("AFEModel").getProperty("/AdjuntosLocal");
                aAdjuntos.splice(sIndex, 1);
                that.getView().getModel("AFEModel").setProperty("/AdjuntosLocal", aAdjuntos);
                this.getView().byId("idUploaderBorrador").setEnabled(true);
            },

            validacionesCreacionAFE: function () {
                var bError = false;
                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                return bError;
            },

            handleCreacionAFEPress: function () {

                if (this.handleValidacionesCreacion()) {
                    sap.m.MessageBox.error("Complete los campos obligatorios");
                    return;
                }

                if (this.handleValidacionesMontoSolicitado()) {
                    sap.m.MessageBox.error("Revise el monto solicitado. La descomposición del gasto debe de coincidir con el monto requerido");
                    return;
                }

                var oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirmación",
                    content: new sap.m.Text({
                        text: "¿Está seguro que desea generar la orden de inversión?"
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Aceptar",
                        press: function () {
                            oConfirmDialog.close();
                            that.crearAFE();
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

            crearAFE: function () {

                this.getManifestModel("adjuntosModel").setProperty("/isNewAFE",true);

                if (this.handleValidacionesCreacion()) {
                    sap.m.MessageBox.error("Complete los campos obligatorios");
                    return;
                }

                if (this.handleValidacionesMontoSolicitado()) {
                    sap.m.MessageBox.error("Revise el monto solicitado. La descomposición del gasto debe de coincidir con el monto requerido");
                    return;
                }

                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var aAdjuntos = this.getOwnerComponent().getModel("AFEModel").getProperty("/AdjuntosLocal");
                var aAdjuntosPrevios = this.getOwnerComponent().getModel("AFEModel").getProperty("/Adjuntos");
                aAdjuntos = (aAdjuntos && aAdjuntos.length > 0) ? aAdjuntos : [];
                aAdjuntosPrevios = (aAdjuntosPrevios && aAdjuntosPrevios.length > 0) ? aAdjuntosPrevios : [];

                var oAFEDeep = {
                    AFE: "",
                    Estado: (oAFE.Creador === oAFE.Responsable) ? "3" : "2", // '3' = jefe / '2' = responsable
                    Complementario: oAFE.Complementario,
                    NumeroRevision: oAFE.NumeroRevision.toString(),
                    FechaEmision: oAFE.FechaEmision,
                    Creador: "",
                    Responsable: oAFE.Responsable,
                    Jefe: oAFE.Jefe,
                    Gerente: oAFE.Gerente,
                    SectorOrigen: oAFE.SectorOrigen,
                    PeriodoDesde: oAFE.PeriodoDesde,
                    PeriodoHasta: oAFE.PeriodoHasta,
                    ImputadoA: oAFE.ImputadoA,
                    Titulo: oAFE.Titulo,
                    Categoria: oAFE.Categoria,
                    Codigo: oAFE.Codigo,
                    TipoInversionMantCapital: oAFE.TipoInversionMantCapital,
                    TipoInversionCrecRentabilidad: oAFE.TipoInversionCrecRentabilidad,
                    MontoPresupuestado: oAFE.MontoPresupuestado.toString(),
                    MontoSolicitado: oAFE.MontoSolicitado,
                    MontoSolicitadoMoneda: oAFE.MontoSolicitadoMoneda,
                    MontoMonedaOrigen: oAFE.MontoMonedaOrigen,
                    MontoMonedaOrigenMoneda: oAFE.MontoMonedaOrigenMoneda,
                    Diferencia: oAFE.Diferencia,
                    MontoCompensado: oAFE.MontoCompensado,
                    Desvio: oAFE.Desvio,
                    DescomposicionGasto1: oAFE.DescomposicionGasto1.toString(),
                    DescomposicionGasto2: oAFE.DescomposicionGasto2.toString(),
                    DescomposicionGasto3: oAFE.DescomposicionGasto3.toString(),
                    DescomposicionGasto4: oAFE.DescomposicionGasto4.toString(),
                    DescomposicionGasto5: oAFE.DescomposicionGasto5.toString(),
                    ResumenPropuesta: oAFE.ResumenPropuesta,
                    AniosVidaUtilEstimados: oAFE.AniosVidaUtilEstimados.toString(),
                    FechaEstimadaCierre: oAFE.FechaEstimadaCierre,
                    RetornoInversion: oAFE.RetornoInversion,
                    IncluyeReemplazos: oAFE.IncluyeReemplazos,
                    Observacion: oAFE.Observacion,
                    InformeTecnicoDescripcion: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoDescripcion : "",
                    InformeTecnicoDestino: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoDestino : "",
                    InformeTecnicoCalculo: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoCalculo : "",
                    DatosComplementariosObjetivo: oAFE.DatosComplementariosObjetivo,
                    DatosComplementariosJustificacion: oAFE.DatosComplementariosJustificacion,
                    DatosComplementariosAlcance: oAFE.DatosComplementariosAlcance,
                    DatosComplementariosAntecedentes: oAFE.DatosComplementariosAntecedentes,
                    DatosComplementariosEstimacion: oAFE.DatosComplementariosEstimacion,
                    DatosComplementariosAlternativas: oAFE.DatosComplementariosAlternativas,
                    DatosComplementariosVariacion: oAFE.DatosComplementariosVariacion,
                    DatosComplementariosImpactoAmbiental: oAFE.DatosComplementariosImpactoAmbiental,
                    DatosComplementariosCronograma: oAFE.DatosComplementariosCronograma,
                    To_Adjuntos: []
                }

                that.oGlobalBusyDialog.setText("Generando AFE. Aguarde por favor");
                that.oGlobalBusyDialog.open();

                this.getOwnerComponent().getModel().bUseBatch = false;

                // crear AFE
                this.getOwnerComponent().getModel().create("/OrdenInversionSet", oAFEDeep, {
                    success: function (oData) {
                        that.oGlobalBusyDialog.close();
                        var sAFE = oData.AFE;
                        that.newAFE = oData.AFE;

                        if (sAFE) {
                            // si hay adjuntos subirlos al repositorio con 'Document service'
                            if (aAdjuntos.length > 0) {
                                that.newAFE = sAFE;
                                sap.m.MessageBox.success("AFE " + sAFE + " generada correctamente. Se realizará la subida de los adjuntos al repositorio", {
                                    onClose: function (sAction) {
                                        that.uploadAdjuntos(sAFE,that.AFE);
                                    }
                                });
                            } else {
                                if (aAdjuntosPrevios.length == 0) {
                                    sap.m.MessageBox.success("AFE " + sAFE + " generada correctamente.", {
                                        onClose: function (sAction) {
                                            // that.handleNavBack();
                                            that.deleteAFEPostBorrador(that.AFE);
                                            // that.getDataNewFolder();
                                        }
                                    });
                                } else {
                                    sap.m.MessageBox.success("AFE " + sAFE + " generada correctamente. Se realizará la subida de los adjuntos al repositorio", {
                                        onClose: function (sAction) {
                                            // that.handleNavBack();
                                            that.getDataNewFolder();
                                        }
                                    });
                                }
                            }
                        }
                    }.bind(this),
                    error: function (oError) {
                        if (oError.responseText) {
                            var oMensaje = JSON.parse(oError.responseText);                          
                        }
                        var sMensaje = oMensaje.error.message.value || "Error al crear la orden de inversión";
                        sap.m.MessageBox.error(sMensaje);
                        that.oGlobalBusyDialog.close();
                    }.bind(this)
                });

            },

            handleValidacionesCreacion: function () {
                var bError = false;
                var oDatosAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var oModelEstadosValidaciones = this.getOwnerComponent().getModel("estadosValidaciones");

                if (!oDatosAFE.NumeroRevision) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_NumeroRevision", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_NumeroRevision", "None");
                }

                if (!oDatosAFE.FechaEmision) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_FechaEmision", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_FechaEmision", "None");
                }

                if (!oDatosAFE.Creador) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Creador", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Creador", "None");
                }

                if (!oDatosAFE.Responsable) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Responsable", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Responsable", "None");
                }

                if (!oDatosAFE.Gerente) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Gerente", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_Gerente", "None");
                }

                if (!oDatosAFE.SectorOrigen) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_SectorOrigen", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_SectorOrigen", "None");
                }

                if (!oDatosAFE.PeriodoDesde) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoDesde", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoDesde", "None");
                }

                if (!oDatosAFE.PeriodoHasta) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", "None");
                }

                if (oDatosAFE.PeriodoDesde && oDatosAFE.PeriodoHasta && (oDatosAFE.PeriodoDesde > oDatosAFE.PeriodoHasta)) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_PeriodoHasta", "None");
                }

                if (!oDatosAFE.ImputadoA) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_ImputadoA", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_ImputadoA", "None");
                    if ((oDatosAFE.ImputadoA === "1" || oDatosAFE.ImputadoA === "2" || oDatosAFE.ImputadoA === "3") && !oDatosAFE.Titulo) {
                        bError = true;
                        oModelEstadosValidaciones.setProperty("/DatosGenerales_Titulo", "Error");
                    } else {
                        oModelEstadosValidaciones.setProperty("/DatosGenerales_Titulo", "None");
                    }
                }

                if (!oDatosAFE.MontoSolicitado || (parseFloat(oDatosAFE.MontoSolicitado) <= 0)) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_MontoSolicitado", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_MontoSolicitado", "None");
                }

                if (!oDatosAFE.AniosVidaUtilEstimados || (parseInt(oDatosAFE.AniosVidaUtilEstimados) <= 0)) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_AniosVidaUtilEstimados", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_AniosVidaUtilEstimados", "None");
                }

                if (!oDatosAFE.FechaEstimadaCierre) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_FechaEstimadaCierre", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_FechaEstimadaCierre", "None");
                }

                if (!oDatosAFE.InformeTecnicoDescripcion && oDatosAFE.IncluyeReemplazos) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Descripcion", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Descripcion", "None");
                }

                if (!oDatosAFE.InformeTecnicoDestino && oDatosAFE.IncluyeReemplazos) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Destino", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Destino", "None");
                }

                if (!oDatosAFE.InformeTecnicoCalculo && oDatosAFE.IncluyeReemplazos) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Calculo", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosInformeTecnico_Calculo", "None");
                }

                if (!oDatosAFE.DatosComplementariosObjetivo) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Objetivo", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Objetivo", "None");
                }

                if (!oDatosAFE.DatosComplementariosJustificacion) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Justificacion", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Justificacion", "None");
                }

                if (!oDatosAFE.DatosComplementariosAlcance) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Alcance", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Alcance", "None");
                }

                if (!oDatosAFE.DatosComplementariosVariacion) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Variacion", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosComplementarios_Variacion", "None");
                }
                debugger;
                return bError;
            },

            handleValidacionesMontoSolicitado: function () {
                var bError = false;
                var oDatosAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var oModelEstadosValidaciones = this.getOwnerComponent().getModel("estadosValidaciones");
                var bValidoDiferencia = this.validarPeriodosDiferencia();
                var sTotalDescomposicion = (parseFloat(oDatosAFE.DescomposicionGasto1) + parseFloat(oDatosAFE.DescomposicionGasto2) +
                    parseFloat(oDatosAFE.DescomposicionGasto3) + parseFloat(oDatosAFE.DescomposicionGasto4) + parseFloat(oDatosAFE.DescomposicionGasto5));

                if (!oDatosAFE.MontoSolicitado || (parseFloat(oDatosAFE.MontoSolicitado) <= 0) ||
                    ((parseFloat(oDatosAFE.MontoSolicitado)) !== parseFloat(sTotalDescomposicion)) || !bValidoDiferencia) {
                    bError = true;
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_MontoSolicitado", "Error");
                } else {
                    oModelEstadosValidaciones.setProperty("/DatosGenerales_MontoSolicitado", "None");
                }
                debugger;
                return bError;
            },

            handleChangeImputacion: function (oEvent) {
                var sImputacionKey = oEvent.getSource().getSelectedKey();
                that.changeImputacion(sImputacionKey);
            },

            changeImputacion: function (sImputacionKey) {
                if (!sImputacionKey) {
                    return;
                }                
                var sTitulo;
                var sCategoria;
                var sCodigo;
                var bTipoInversionMantCapital = false;
                var bTipoInversionCrecRentabilidad = false;
                var bTipoInversionDatosEditables = false;
                var bTituloEditable = false;
                var aImputaciones = this.getOwnerComponent().getModel("valueHelpModel").getProperty("/Imputaciones");
                if (sImputacionKey && sImputacionKey !== "1" && sImputacionKey !== "2" && sImputacionKey !== "3") {
                    var aDatosImputacion = aImputaciones.filter(function (imputacion) { return imputacion.NumeroOrden === sImputacionKey; });
                    var oDatosImputacion = aDatosImputacion.length ? aDatosImputacion[0] : {};
                    if (oDatosImputacion) {
                        sTitulo = oDatosImputacion.Titulo;
                        sCategoria = oDatosImputacion.Categoria;
                        sCodigo = oDatosImputacion.Codigo;
                        switch (sCategoria) {
                            case "MA":
                            case "MU":
                            case "CA":
                            case "PP":
                                bTipoInversionMantCapital = true;
                                break;
                            case "IN":
                            case "HW":
                            case "CR":
                                bTipoInversionCrecRentabilidad = true;
                                break;
                            default:
                                break;
                        }
                    }
                    that.getMontoPresupuestado(sImputacionKey);
                } else {
                    bTipoInversionDatosEditables = true;
                    bTipoInversionMantCapital = false;
                    bTipoInversionCrecRentabilidad = false;
                    if (sImputacionKey === "1" || sImputacionKey === "2" || sImputacionKey === "3") {
                        bTituloEditable = true;
                        this.getOwnerComponent().getModel("AFEModel").setProperty("/MontoPresupuestado", "0");                        
                    }
                }
                this.getOwnerComponent().getModel("AFEModel").setProperty("/Titulo", sTitulo);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/TituloEditable", bTituloEditable);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/Categoria", sCategoria);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/Codigo", sCodigo);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/TipoInversionMantCapital", bTipoInversionMantCapital);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/TipoInversionCrecRentabilidad", bTipoInversionCrecRentabilidad);
                this.getOwnerComponent().getModel("AFEModel").setProperty("/TipoInversionDatosEditables", bTipoInversionDatosEditables);
            },

            getMontoPresupuestado: function(psNumeroOrden) {
                if (!psNumeroOrden) {
                    return;
                }
                var sKey = this.getOwnerComponent().getModel().createKey("/ValueHelpImputacionSet", {
                    "NumeroOrden": psNumeroOrden
                });
                var sPath = sKey + "/To_MontoPresupuestado";
                that.oGlobalBusyDialog.setText("Obteniendo el monto presupuestado. Aguarde por favor");
                that.oGlobalBusyDialog.open();
                this.getOwnerComponent().getModel().read(sPath, {
                    success: function (oData) {
                        var sMonto = parseFloat(oData.Monto) || "0";
                        this.getOwnerComponent().getModel("AFEModel").setProperty("/MontoPresupuestado", sMonto);
                        that.oGlobalBusyDialog.close();
                    }.bind(this),
                    error: function (oError) {
                        that.oGlobalBusyDialog.close();
                    }.bind(this)
                });
            },

            handleChangeIncluyeReemplazos: function() {
                var bIncluyeReemplazos = this.getOwnerComponent().getModel("AFEModel").getProperty("/IncluyeReemplazos");
                if (!bIncluyeReemplazos) {
                    this.getOwnerComponent().getModel("AFEModel").setProperty("/InformeTecnicoDescripcion", "");
                    this.getOwnerComponent().getModel("AFEModel").setProperty("/InformeTecnicoDestino", "");
                    this.getOwnerComponent().getModel("AFEModel").setProperty("/InformeTecnicoCalculo", "");
                }
            },

            handleUpdateAFEBorradorPress: function() {
                var oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirmación",
                    content: new sap.m.Text({
                        text: "¿Está seguro que desea actualizar borrador de la orden de inversión?"
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Aceptar",
                        press: function () {
                            oConfirmDialog.close();
                            that.onUpdateBorradorAFE();
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

            setPreviousData: function(aDato) {
                this.getView().byId("sectorSelect").setValue(aDato.SectorOrigen);
                // this.getView().byId("idTitulo").setValue(aDato.Titulo);
                this.getView().byId("idResponsables").setValue(aDato.Responsable);
                this.getView().byId("idJefe").setValue(aDato.Jefe);
                // this.getView().byId("idImputado").setValue(this.changeImputacion(aDato.ImputadoA));
                // this.changeImputacion(aDato.ImputadoA);
            },

            handleBorrarBorradorAFEPress: function(oEvent) {

                var oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirmación",
                    content: new sap.m.Text({
                        text: "¿Está seguro que desea eliminar borrador AFE?"
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Aceptar",
                        press: function () {
                            oConfirmDialog.close();
                            that.onBorrarAFE();
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
            
            onBorrarAFE: function () {
                // var oAFE = oEvent.getSource().getBindingContext("AFEModel").getObject();
                that.oGlobalBusyDialog.setText("Eliminando borrador AFE y adjuntos");
                that.oGlobalBusyDialog.open();
                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionBorradorSet", {
                    AFE: oAFE.AFE
                });
                var oModel = this.getOwnerComponent().getModel();
                oModel.setUseBatch(false);
                oModel.remove(sPath, {
                    method:"DELETE",
                    success: function (oData) {
                        sap.m.MessageBox.success("Borrador AFE nro: " + oAFE.AFE + " eliminado con exito", {
                            onClose: function (sAction) {
                                that.getDataFolder(oAFE.AFE);
                                // that.handleNavBack();
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageBox.error("Error al eliminar borrador AFE", {
                            onClose: function (sAction) {
                                that.oGlobalBusyDialog.close();
                                that.handleNavBack();
                            }
                        });
                    }.bind(this)
                });
            },

            getAFEAdjuntos: function (psAFE) {
                // var oTable = this.getView().byId("adjuntosTable");
                var aAdjuntos = [];
                var oModel = this.getManifestModel("adjuntosModel");
                var oData = oModel.getData();
                var sUrlFolder = oData.repoId + "/root" + "/" + psAFE;
                var that = this;
                this.getDataRepo(sUrlFolder)
                    .then((response) => {
                        aAdjuntos = that.getAdjuntos(response);
                        if (aAdjuntos.length === 0) {
                            // aAdjuntos = [{ "filename": "No se encontraron Adjuntos", "url": "", "objectId": "" }];
                        }
                        that.getOwnerComponent().getModel("AFEModel").setProperty("/Adjuntos", aAdjuntos);
                        // oTable.setModel("AFEModel");
                    }).catch(oError => {
                        // aAdjuntos = [{ "filename": "No se encontraron Adjuntos", "url": "", "objectId": "" }];
                        that.getManifestModel("adjuntosModel").setProperty("/adjuntos", aAdjuntos);
                        // oTable.setModel("AFEModel");
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

            handleEliminarAdjuntoSDM: function(oEvent) {
                var docId = oEvent.getSource().getBindingContext("AFEModel").getProperty("objectId");
                var oTable = this.getView().byId("adjuntosTable");
                var aAdjuntos = [];
                var oModel = this.getManifestModel("adjuntosModel");
                var oData = oModel.getData();
                var sPath = "/" + that.AFE
                var sUrlFolder = oData.repoId + "/root" + "/" + that.AFE;

                this.getDataRepo(sUrlFolder).
                    then(response => {
                        aAdjuntos = that.getAdjuntos(response);
                        for (var i = 0; i < aAdjuntos.length; i++) {
                            if (aAdjuntos[i].objectId == docId) {
                                this._deleteFile(docId,sPath);
                            }
                        }
                        // this.getModel("AFEModel").refresh(true);
                        // that.getAFEAdjuntos(that.AFE);
                    });
            },

            _deleteFile: function(docId,sPath) {
            var data = new FormData();

            var dataObject = {
                "cmisaction": "delete",
                "objectId": docId
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
                    that.getAFEAdjuntos(that.AFE);
                },
                error: function (oResponse) {
                    that.oGlobalBusyDialog.close();
                    console.Console(oResponse);
                }
            });
            },

            onUpdateBorradorAFE: function() {
                this.getManifestModel("adjuntosModel").setProperty("/isNewAFE",false);
                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var aAdjuntosF = this.getOwnerComponent().getModel("AFEModel").getProperty("/AdjuntosLocal");
                aAdjuntosF = (aAdjuntosF && aAdjuntosF.length > 0) ? aAdjuntosF : [];

                var oAFEDeep = {
                    AFE: oAFE.AFE,
                    Estado: (oAFE.Creador === oAFE.Responsable) ? "3" : "2", // '3' = jefe / '2' = responsable
                    Complementario: oAFE.Complementario,
                    NumeroRevision: oAFE.NumeroRevision.toString(),
                    FechaEmision: oAFE.FechaEmision,
                    Creador: "",
                    Responsable: oAFE.Responsable,
                    Jefe: oAFE.Jefe,
                    Gerente: oAFE.Gerente,
                    SectorOrigen: oAFE.SectorOrigen,
                    PeriodoDesde: oAFE.PeriodoDesde,
                    PeriodoHasta: oAFE.PeriodoHasta,
                    ImputadoA: oAFE.ImputadoA,
                    Titulo: oAFE.Titulo,
                    Categoria: oAFE.Categoria,
                    Codigo: oAFE.Codigo,
                    TipoInversionMantCapital: oAFE.TipoInversionMantCapital,
                    TipoInversionCrecRentabilidad: oAFE.TipoInversionCrecRentabilidad,
                    MontoPresupuestado: oAFE.MontoPresupuestado.toString(),
                    MontoSolicitado: oAFE.MontoSolicitado,
                    MontoSolicitadoMoneda: oAFE.MontoSolicitadoMoneda,
                    MontoMonedaOrigen: oAFE.MontoMonedaOrigen,
                    MontoMonedaOrigenMoneda: oAFE.MontoMonedaOrigenMoneda,
                    Diferencia: oAFE.Diferencia,
                    MontoCompensado: oAFE.MontoCompensado,
                    Desvio: oAFE.Desvio,
                    DescomposicionGasto1: oAFE.DescomposicionGasto1.toString(),
                    DescomposicionGasto2: oAFE.DescomposicionGasto2.toString(),
                    DescomposicionGasto3: oAFE.DescomposicionGasto3.toString(),
                    DescomposicionGasto4: oAFE.DescomposicionGasto4.toString(),
                    DescomposicionGasto5: oAFE.DescomposicionGasto5.toString(),
                    ResumenPropuesta: oAFE.ResumenPropuesta,
                    AniosVidaUtilEstimados: oAFE.AniosVidaUtilEstimados.toString(),
                    FechaEstimadaCierre: oAFE.FechaEstimadaCierre,
                    RetornoInversion: oAFE.RetornoInversion,
                    IncluyeReemplazos: oAFE.IncluyeReemplazos,
                    Observacion: oAFE.Observacion,
                    InformeTecnicoDescripcion: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoDescripcion : "",
                    InformeTecnicoDestino: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoDestino : "",
                    InformeTecnicoCalculo: (oAFE.IncluyeReemplazos) ? oAFE.InformeTecnicoCalculo : "",
                    DatosComplementariosObjetivo: oAFE.DatosComplementariosObjetivo,
                    DatosComplementariosJustificacion: oAFE.DatosComplementariosJustificacion,
                    DatosComplementariosAlcance: oAFE.DatosComplementariosAlcance,
                    DatosComplementariosAntecedentes: oAFE.DatosComplementariosAntecedentes,
                    DatosComplementariosEstimacion: oAFE.DatosComplementariosEstimacion,
                    DatosComplementariosAlternativas: oAFE.DatosComplementariosAlternativas,
                    DatosComplementariosVariacion: oAFE.DatosComplementariosVariacion,
                    DatosComplementariosImpactoAmbiental: oAFE.DatosComplementariosImpactoAmbiental,
                    DatosComplementariosCronograma: oAFE.DatosComplementariosCronograma,
                }

                that.oGlobalBusyDialog.setText("Generando borrador AFE. Aguarde por favor");
                that.oGlobalBusyDialog.open();

                this.getOwnerComponent().getModel().bUseBatch = false;

                var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionBorradorSet", {
                    AFE: that.AFE
                });

                this.getOwnerComponent().getModel().update(sPath, oAFEDeep, {
                    success: function (oData) {
                        that.oGlobalBusyDialog.close();
                        // var sAFE = oData.AFE;
                        if (that.AFE) {
                            // si hay adjuntos subirlos al repositorio con 'Document service'
                            if (aAdjuntosF.length > 0) {
                                sap.m.MessageBox.success("Borrador AFE " + that.AFE + " actualizado correctamente. Se realizará la subida de los adjuntos al repositorio", {
                                    onClose: function (sAction) {
                                        that.uploadAdjuntos(that.AFE,that.AFE);
                                    }
                                });
                            } else {
                                sap.m.MessageBox.success("Borrador AFE " + that.AFE + " generada correctamente", {
                                    onClose: function (sAction) {
                                        that.handleNavBack();
                                    }
                                });
                            }
                        }
                    }.bind(this),
                    error: function (oError) {
                        if (oError.responseText) {
                            var oMensaje = JSON.parse(oError.responseText);                          
                        }
                        var sMensaje = oMensaje.error.message.value || "Error al crear la orden de inversión";
                        sap.m.MessageBox.error(sMensaje);
                        that.oGlobalBusyDialog.close();
                    }.bind(this)
                });


            },

            pruebaRenameFolder: function() {
            var data = new FormData();

            var dataObject = {
                "cmisaction": "update",
                "objectId": "Z_naU7bvOll1KDCUnUZC2VD8BkA-H5VM05E9Uv63soI",
                "propertyId[0]": "cmis:name",
                "propertyValue[0]": "9000000001"
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }
            // var urlM = this.getDMSUrl("/SDM_API/browser") + "/" + this._dmsUrl;
            return $.ajax({
                url: this.getManifestModel("adjuntosModel").getProperty("/url"),
                type: "POST",
                data: data,
                contentType: false,
                processData: false,
                success: function (oData, oResponse) {
                    console.log(oData);
                    console.log(oResponse);
                },
                error: function (oResponse) {
                    console.Console(oResponse);
                }
            });
            },

            getObjIdFolder: function(oResponse,afe,psAFE) {
                var objIdFolderArr = [];
                var oFolder = {};
                var aFilesAgregados = that.getView().getModel("AFEModel").getProperty("/Adjuntos");
                if (aFilesAgregados != undefined) {
                    for (var i = 0; i < oResponse.objects.length; i++) {
                        oFolder = oResponse.objects[i].object.properties;
                        var objIdFolder = {};
                        if (oFolder["cmis:name"].value == afe) {
                            that.getManifestModel("adjuntosModel").setProperty("/folderObjId",oFolder["cmis:objectId"].value);
                        }
                    }
                } else {
                    oFolder = oResponse.properties;
                    if (oFolder != undefined) {
                        that.getManifestModel("adjuntosModel").setProperty("/folderObjId",oFolder["cmis:objectId"].value);
                    } else {
                    // that.getManifestModel("adjuntosModel").setProperty("/folderObjId",oFolder["cmis:objectId"].value);
                        that.getManifestModel("adjuntosModel").setProperty("/folderObjId",null);
                    }
                }
            },

            renameFolder: function() {
            var data = new FormData();
            var objIdFolder = this.getManifestModel("adjuntosModel").getProperty("/folderObjId");
            var sNewAFE = this.newAFE;

            var dataObject = {
                "cmisaction": "update",
                "objectId": objIdFolder,
                "propertyId[0]": "cmis:name",
                "propertyValue[0]": sNewAFE
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }
            // var urlM = this.getDMSUrl("/SDM_API/browser") + "/" + this._dmsUrl;
            return $.ajax({
                url: this.getManifestModel("adjuntosModel").getProperty("/url"),
                type: "POST",
                data: data,
                contentType: false,
                processData: false,
                success: function (oData, oResponse) {
                    that.deleteAFEPostBorrador(that.AFE);
                },
                error: function (oResponse) {
                    that.oGlobalBusyDialog.close();
                    console.Console(oResponse);
                }
            });
            },

            deleteAFEPostBorrador: function(sAFE) {
                var text = "";
                var sPath = "/" + that.getOwnerComponent().getModel().createKey("OrdenInversionBorradorSet", {
                    AFE: sAFE
                });
                var oModel = this.getOwnerComponent().getModel();
                var aAdjuntos = this.getOwnerComponent().getModel("AFEModel").getProperty("/AdjuntosLocal");
                var aAdjuntosPrevios = this.getOwnerComponent().getModel("AFEModel").getProperty("/Adjuntos");
                aAdjuntos = (aAdjuntos && aAdjuntos.length > 0) ? aAdjuntos : [];
                aAdjuntosPrevios = (aAdjuntosPrevios && aAdjuntosPrevios.length > 0) ? aAdjuntosPrevios : [];

                if (aAdjuntos.length == 0 && aAdjuntosPrevios.length == 0) {
                    text = "Presione para continuar";
                } else {
                    text = "Adjuntos subidos correctamente";
                }

                oModel.setUseBatch(false);
                oModel.remove(sPath, {
                    method:"DELETE",
                    success: function (oData) {
                        that.oGlobalBusyDialog.close();
                        sap.m.MessageBox.success(text, {
                            onClose: function (sAction) {
                                that.handleNavBack();
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        that.oGlobalBusyDialog.close();
                        sap.m.MessageBox.error("Error al eliminar borrador AFE", {
                            onClose: function (sAction) {
                                that.handleNavBack();
                            }
                        });
                    }.bind(this)
                });
            },

            getDataNewFolder: function(psAFE) {
                that.oGlobalBusyDialog.setText("Subiendo documentos adjuntos");
                that.oGlobalBusyDialog.open();
                this.getClientFolder(psAFE)
                    .catch(() => {
                        that.oGlobalBusyDialog.close();
                        // sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                        //     onClose: function (sAction) {
                        //         that.handleNavBack();
                        //     }
                        // });
                        that.oGlobalBusyDialog.close();
                        console.log("error lectura folder MDS");
                    })
                    .then((response) => {
                        that.getObjIdFolder(response,that.AFE,psAFE);
                        that.renameFolder();
                    });
            },

            getDataFolder: function(psAFE) {
                this.getClientFolder(psAFE)
                    .catch(() => {
                        that.oGlobalBusyDialog.close();
                        that.handleNavBack();
                        console.log("error lectura folder MDS");
                    })
                    .then((response) => {
                        that.getObjIdFolder(response,psAFE,that.AFE);
                        if (that.getManifestModel("adjuntosModel").getProperty("/folderObjId") != null) {
                            that.deleteFolderTree(psAFE);
                        } else {
                            that.oGlobalBusyDialog.close();
                            that.handleNavBack();
                        }
                    });
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
                // var urlM = this.getDMSUrl("/SDM_API/browser") + "/" + this._dmsUrl;
                return $.ajax({
                    url: this.getManifestModel("adjuntosModel").getProperty("/url"),
                    type: "POST",
                    data: data,
                    contentType: false,
                    processData: false,
                    success: function (oData, oResponse) {
                        that.oGlobalBusyDialog.close();
                        that.handleNavBack();
                    },
                    error: function (oResponse) {
                        that.oGlobalBusyDialog.close();
                        that.handleNavBack();
                        console.Console(oResponse);
                    }
                });
                },
            

        });
    });
