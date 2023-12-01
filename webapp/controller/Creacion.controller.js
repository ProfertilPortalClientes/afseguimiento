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
        return BaseController.extend("profertil.afeseguimiento.controller.Creacion", {
            formatter: formatter,

            onInit: function () {

                that = this;
                that.oGlobalBusyDialog = new sap.m.BusyDialog();

                // inicializar vista
                sap.ui.core.UIComponent.getRouterFor(this).getRoute("Creacion").attachPatternMatched(this._onObjectMatched, this);

            },

            _onObjectMatched: function (oEvent) {

                this.getView().byId("idIconTabBar").setSelectedKey("DatosGenerales");

                // setear modelo que guarda los datos para la creación de la AFE
                this.getOwnerComponent().setModel(models.createAFEModel(), "AFEModel");

                var sCreador = this.getOwnerComponent().getModel("loginModel").getProperty("/DatosUsuario/Usuario");

                this.getOwnerComponent().getModel("AFEModel").setProperty("/Creador", sCreador);

                // setear modelo que guarda los datos para los value help
                this.getOwnerComponent().setModel(models.createValueHelpModel(), "valueHelpModel");

                // seteat modelo para controlar los estados de validaciones
                this.getOwnerComponent().setModel(models.createEstadosValidacionesModel(), "estadosValidaciones");

                // setear modo creación                
                (this.getOwnerComponent().getModel("appModel")) ? this.getOwnerComponent().getModel("appModel").setProperty("/Modo", "creacion") : this.getOwnerComponent().setModel(models.createAppModel("creacion"), "appModel");

                this.initDataValueHelps();

            },

            initDataValueHelps: function () {
                this.getValueHelpResponsable();
                this.getValueHelpJefe();
                this.getValueHelpSector();
                this.getValueHelpImputacion();
                this.getValueHelpMoneda();
                this.setValueHelpPeriodos();
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
                that.oGlobalBusyDialog.setText("Obteniendo el gerente");
                that.oGlobalBusyDialog.open();
                this.getOwnerComponent().getModel().read(sPath, {
                    success: function (oData) {
                        that.oGlobalBusyDialog.close();
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

            uploadAdjuntos: function (psAFE) {
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
                        that.agregarAdjuntos(aFiles, psAFE);
                    }
                };

                // lectura del primer archivo (si hay) o finalizar
                if (aFiles.length > 0) {
                    oReader.readAsDataURL(aFiles[i]);
                } else {
                    that.agregarAdjuntos([], psAFE);
                }
            },

            agregarAdjuntos: function (paFiles, psAFE) {
                if (paFiles.length > 0) {
                    var aPromises = [];
                    this.createFolder(psAFE)
                        .catch(() => {
                            that.oGlobalBusyDialog.close();
                            sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                                onClose: function (sAction) {
                                    that.getView().byId("idUploader").setEnabled(true);
                                    that.handleNavBack();
                                }
                            });
                        })
                        .then(() => {
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
                this.getView().byId("idUploader").setEnabled(true);
                that.oGlobalBusyDialog.close();
                sap.m.MessageBox.success("Adjuntos subidos correctamente", {
                    onClose: function (sAction) {
                        that.handleNavBack();
                    }
                });
            },

            onErrorUpload: function (poError) {
                this.getView().byId("idUploader").setEnabled(true);
                that.oGlobalBusyDialog.close();
                sap.m.MessageBox.error("Error en la subida de los adjuntos al repositorio. Contacte a su administrador", {
                    onClose: function (sAction) {
                        that.handleNavBack();
                    }
                });
            },

            handleUploadAdjunto: function (oEvent) {
                var oUploader = that.getView().byId("idUploader");
                var aFiles = jQuery.sap.domById(oUploader.getId() + "-fu").files;
                var aFilesAgregados = that.getView().getModel("AFEModel").getProperty("/Adjuntos");
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
                that.getView().getModel("AFEModel").setProperty("/Adjuntos", aAdjuntos);
                that.getView().getModel("AFEModel").setProperty("/AdjuntosF", aFilesAgregados);
                if (aFilesAgregados.length > 0) {
                    this.getView().byId("idUploader").setEnabled(false);
                } else {
                    this.getView().byId("idUploader").setEnabled(true);
                }
            },

            // Eliminar archivo listasetdo
            handleEliminarAdjunto: function (oEvent) {
                var oItem = oEvent.getSource().getParent();
                var sIndex = oItem.getParent().indexOfItem(oItem);
                var aAdjuntos = that.getView().getModel("AFEModel").getProperty("/Adjuntos");
                aAdjuntos.splice(sIndex, 1);
                that.getView().getModel("AFEModel").setProperty("/Adjuntos", aAdjuntos);
                this.getView().byId("idUploader").setEnabled(true);
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

                if (this.handleValidacionesCreacion()) {
                    sap.m.MessageBox.error("Complete los campos obligatorios");
                    return;
                }

                if (this.handleValidacionesMontoSolicitado()) {
                    sap.m.MessageBox.error("Revise el monto solicitado. La descomposición del gasto debe de coincidir con el monto requerido");
                    return;
                }

                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var aAdjuntos = this.getOwnerComponent().getModel("AFEModel").getProperty("/Adjuntos");
                aAdjuntos = (aAdjuntos && aAdjuntos.length > 0) ? aAdjuntos : [];

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

                        if (sAFE) {
                            // si hay adjuntos subirlos al repositorio con 'Document service'
                            if (aAdjuntos.length > 0) {
                                sap.m.MessageBox.success("AFE " + sAFE + " generada correctamente. Se realizará la subida de los adjuntos al repositorio", {
                                    onClose: function (sAction) {
                                        that.uploadAdjuntos(sAFE);
                                    }
                                });
                            } else {
                                sap.m.MessageBox.success("AFE " + sAFE + " generada correctamente", {
                                    onClose: function (sAction) {
                                        that.getView().byId("idUploader").setEnabled(true);
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

            // Logica Borrador
            handleCreacionAFEBorradorPress: function() {

                var oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirmación",
                    content: new sap.m.Text({
                        text: "¿Está seguro que desea guardar plantilla borrador?"
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Aceptar",
                        press: function () {
                            oConfirmDialog.close();
                            that.crearBorrador();
                            // that.crearAFE();
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

            crearBorrador: function() {
                var oAFE = this.getOwnerComponent().getModel("AFEModel").getData();
                var aAdjuntos = this.getOwnerComponent().getModel("AFEModel").getProperty("/Adjuntos");
                aAdjuntos = (aAdjuntos && aAdjuntos.length > 0) ? aAdjuntos : [];

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
                    DatosComplementariosCronograma: oAFE.DatosComplementariosCronograma
                }

                that.oGlobalBusyDialog.setText("Generando borrador AFE. Aguarde por favor");
                that.oGlobalBusyDialog.open();

                this.getOwnerComponent().getModel().bUseBatch = false;

                // crear Borrador AFE
                this.getOwnerComponent().getModel().create("/OrdenInversionBorradorSet", oAFEDeep, {
                    success: function (oData) {
                        that.oGlobalBusyDialog.close();
                        var sAFE = oData.AFE;
                        if (sAFE) {
                            // si hay adjuntos subirlos al repositorio con 'Document service'
                            if (aAdjuntos.length > 0) {
                                sap.m.MessageBox.success("Borrador AFE " + sAFE + " generado correctamente. Se realizará la subida de los adjuntos al repositorio", {
                                    onClose: function (sAction) {
                                        that.uploadAdjuntos(sAFE);
                                    }
                                });
                            } else {
                                sap.m.MessageBox.success("Borrador AFE " + sAFE + " generada correctamente", {
                                    onClose: function (sAction) {
                                        that.getView().byId("idUploader").setEnabled(true);
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
            

        });
    });
