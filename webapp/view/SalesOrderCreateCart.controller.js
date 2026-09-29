/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Validator");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.zsalesorder.create.view.SalesOrderCreateCart" , {
	validator: null,

	onInit : function() {
	  sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
	  this.oRouter.attachRouteMatched(function(oEvent) {
			if (oEvent.getParameter("name") === "soCreateCart") {
				this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");

				this.getView().updateBindings();
				this.validator = new cus.sd.zsalesorder.create.util.Validator();
			}
		}, this);

        var oCartData = {
        formatSingleRdd: new Date(),
        itemCount: 3,
        
        activeTab: "sales",
        isConditionEnabled: false,
        selectedItemLines: [],
        customerStatus:[
          {
            ProductID:"1005803",
            Status : "F001",
            Article : "M"
          },
		  {
            ProductID:"10000000",
            Status : "F001",
            Article : "not M"
          },
		   {
            ProductID:"10000001",
            Status : "F002",
            Article : "M"
          },
		  {
            ProductID:"10000002",
            Status : "F002",
            Article : "not M"
          }
        ],
        conditions: [
          {
            conditionType: "PR00 - Price",
            amount: "7,499.00",
            per: "1 EA",
            value: "7,499.00 ZAR"
          },
          {
            conditionType: "K004 - Material Discount",
            amount: "150.00-",
            per: "1 EA",
            value: "150.00- ZAR"
          }
        ]
      };

      var oCartModel = new sap.ui.model.json.JSONModel(oCartData);
      this.getView().setModel(oCartModel, "soc_cart1");



	},

  formatcustomerNumber:function(ProductID){
    if(ProductID){
      var obj =this.getView().getModel("soc_cart1").getProperty('/customerStatus').filter(function(e){if(e.ProductID===ProductID){return e}})
      return obj[0].Status +"-"+ obj[0].Article;
    }
    
    },
    formatoaaMessage:function(ProductID){
      if(ProductID){
      var obj =this.getView().getModel("soc_cart1").getProperty('/customerStatus').filter(function(e){if(e.ProductID===ProductID){return e}})
      if(obj[0].Status === "F001" && obj[0].Article === "not M"){
        return "No Stock Available, Please Remove The Item From Cart";
      }
      if(obj[0].Status === "F001" && obj[0].Article === "M"){
        return "get base DC from the Sales Order Store";
      }
    }
    },
    visibleMessage:function(ProductID){
      if(ProductID){
      var obj =this.getView().getModel("soc_cart1").getProperty('/customerStatus').filter(function(e){if(e.ProductID===ProductID){return e}})
      if(obj[0].Status === "F001" && obj[0].Article === "not M"){
        return true;
      }
      else if(obj[0].Status === "F001" && obj[0].Article === "M"){
        return true;
      }else{
        return false;
      }
    }
    },
    setType:function(ProductID){
      if(ProductID){
      var obj =this.getView().getModel("soc_cart1").getProperty('/customerStatus').filter(function(e){if(e.ProductID===ProductID){return e}})
      if(obj[0].Status === "F001" && obj[0].Article === "not M"){
        return "Error";
      }
      else if(obj[0].Status === "F001" && obj[0].Article === "M"){
        return "Warning";
      }else{
        return "Information";
      }
    }
    },

    onItemSelectionChange: function () {
      var oTable = this.byId("SOC_CART_LIST");
      var oModel = this.getView().getModel("soc_cart");
      var oModel2 = this.getView().getModel("soc_cart1");
      if (!oTable || !oModel) {
        return;
      }
      var aSelectedContexts = oTable.getSelectedContexts();
      var bHasSelection = aSelectedContexts && aSelectedContexts.length > 0;
      oModel2.setProperty("/isConditionEnabled", bHasSelection);

      if (bHasSelection) {
        var aLines = aSelectedContexts.map(function (oCtx) {
          return oCtx.getProperty("itemLine");
        });
        oModel.setProperty("/selectedItemLines", aLines);
      } else {
        oModel.setProperty("/selectedItemLines", []);
        if (oModel2.getProperty("/activeTab") === "conditions") {
          oModel2.setProperty("/activeTab", "sales");
        }
      }
    },

    onPressSalesTab: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (oModel) {
        oModel.setProperty("/activeTab", "sales");
      }
    },

    onPressConditionsTab: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (!oModel) {
        return;
      }
      if (!oModel.getProperty("/isConditionEnabled")) {
        sap.m.MessageToast.show("Please select at least one line item first.");
        return;
      }
      oModel.setProperty("/activeTab", "conditions");
    },

    onAddCondition: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (!oModel) {
        return;
      }
      var aConditions = oModel.getProperty("/conditions") || [];
      var aSelectedLines = oModel.getProperty("/selectedItemLines") || [];
      var sLine = aSelectedLines.length > 0 ? aSelectedLines[0] : "";

      aConditions.push({
        conditionType: "PR00 - Price",
        amount: "0.00",
        per: "1 EA",
        value: "0.00 ZAR"
      });
      oModel.setProperty("/conditions", aConditions);
      oModel.refresh(true);
      sap.m.MessageToast.show("Condition added" + (sLine ? " for Item " + sLine : ""));
    },

    onRemoveCondition: function (oEvent) {
      var oSource = oEvent.getSource();
      var oCtx = oSource.getBindingContext("soc_cart1");
      if (!oCtx) {
        return;
      }
      var sPath = oCtx.getPath();
      var iIndex = parseInt(sPath.split("/").pop(), 10);
      var oModel = this.getView().getModel("soc_cart1");
      var aConditions = oModel.getProperty("/conditions") || [];
      aConditions.splice(iIndex, 1);
      oModel.setProperty("/conditions", aConditions);
      sap.m.MessageToast.show("Condition removed");
    },

	removeItem : function(event) {
		var button = event.getSource();

		var listItem = button.getParent();
		var path = listItem.getBindingContext("soc_cart").getPath();
		
		//Removed for fixing cart item count issue with UI5 1.32.*
		//var cartName = "oShoppingCartItems";
		//var extractPath = path.split("/");
		//var itemIndex = path.substr(path.lastIndexOf("/") + 1);
		
		var itemIndex = parseInt(path.substring(path.lastIndexOf('/') +1));
		
		//Removed for fixing cart item count issue with UI5 1.32.*
	/*	var i;
		for(i = 0; i < extractPath.length; i++) {
			if(extractPath[i] === cartName) {
				itemIndex = extractPath[i + 1];
				break;
			}
		}*/
		
		var datePickerCellPosition = 4;
		var datePicker = listItem.getCells()[datePickerCellPosition];
		this.validator.unregisterInvalidControl(datePicker.getId());
		
		// the below is done to avoid the images being re-rendered everytime when list-items gets removed.
		// might not be the best way !
		//mark the to be removed item as null
		//Removed for fixing cart item count issue with UI5 1.32.*
		//listItem.setParent(null);

		//update the model
		cus.sd.zsalesorder.create.util.ModelUtils.deleteCartItemAtIndex(itemIndex);
		//Removed for fixing cart item count issue with UI5 1.32.*
		//this.getView().byId("SOC_CART_LIST").removeItem(listItem);
	},

	//commented to use Dateinput instead of datepicker.
	setUniformRDD : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			datePicker.getModel("soc_cart").setProperty("RDD", sDate, datePicker.getBindingContext("soc_cart"));
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

//	setUniformRDD : function(event) {
//		cus.sd.zsalesorder.create.util.ModelUtils.setUniformRddInCartModel();
//	},

	//Commenting to allow Dateinput usage
	setUniformSingleRdd : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			this.getView().getModel("soc_cart").setProperty("/singleRdd", sDate);
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	onATPCheck : function() {
		//	var bindingContext = this.getView().getBindingContext();
		//	var path = bindingContext.sPath;
		//	path = path.substr(1);
		//  Access the bound data for this page using the path.
		//	var modelData = new sap.ui.model.json.JSONModel();
		//	modelData.setData(bindingContext.getModel().oData[path]);
		//		this.oApplicationFacade.setApplicationModel(modelData,"soc_mainmodel");
    var status = this.byId('statustxtId').getText();
    if(status==="F001-not M"){
      sap.m.MessageToast.show("No stock available.Remove the item from cart");
      return;
    }
    var arrQty=this.getView().getModel("soc_cart").getProperty('/oShoppingCartItems').map(function(e){return e.qty});
    var totalQty= arrQty.reduce((a, b) => {return a + b}, 0)
    if(status==="F002-not M" && totalQty>7){
      sap.m.MessageToast.show("The requested quantity exceeds the available stock. Only 7 units are available.");
      return;
    }
		if (this.validator.getInvalidControlsNumber() === 0) {
			this.oRouter.navTo("quickCheckout", {});
		} else {
			sap.m.MessageBox.show(
					this.getView().getModel("i18n").getProperty("MISSING_INVALID"), 
					sap.m.MessageBox.Icon.ERROR, 
					this.getView().getModel("i18n").getProperty("MISSING_TITLE"), 
					[sap.m.MessageBox.Action.OK]
			);
		}
	},

    _onNavigateHome : function() {
    	// Go back to customers page
//	   	 this.oRouter.navTo("master", {
//	
//	   	});;
    	window.history.go(-1);
    },

	onNumberEnter : function(oEvent){
		var textValue = oEvent.getParameters().newValue;

		if(textValue.indexOf("-") !== -1){  // replace -ve values
			var restrictedValue = textValue.replace("-","");
			oEvent.getSource().setValue(restrictedValue);
		}
		if ( !this.isNumberFieldValid(textValue) ){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			this.validator.registerInvalidControl(oEvent.getSource().getId());
		}
		else{
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			this.validator.unregisterInvalidControl(oEvent.getSource().getId());
		}
		
	},
	
	 getHeaderFooterOptions : function() {
	        var aButtonList = [];

	            aButtonList.push({
	                    sI18nBtnTxt : "CONTINUE",
	                    onBtnPressed : jQuery.proxy(this.onATPCheck, this)
	                });

	        return {
	        	sI18NFullscreenTitle  : "CART",
	            buttonList : aButtonList,
	            onBack : jQuery.proxy(this._onNavigateHome, this),
	            bSuppressBookmarkButton :true
	        };
	    },
		isNumberFieldValid : function(testNumber){
		      var noSpaces = testNumber.replace(/ +/,'');  //Remove leading spaces
		      var isNum = /^\d+$/.test(noSpaces); // test for numbers only and return true or false
		      return isNum; 
		},
		// custom code starts 
			 onAddLinkedProd: function (oEvent) {

            var oCore = sap.ui.getCore();
            var oThis = this;
            var oView = oThis.getView();
            var siteCode = "M001";
            //var productType = "CCash";
            var obj= oEvent.getSource().getParent().getBindingContext('soc_cart').getObject();
            var articleNumber = obj.ProductID;
            //new sap.ui.model.Filter( "site", "EQ", siteCode + "|" + productType ),
            var aFilters = [ new sap.ui.model.Filter( "site", "EQ", siteCode ),
                             new sap.ui.model.Filter( "articleNumber","EQ",articleNumber )];

                 oView.getModel().read("/ArticleListSet", {
                     filters: aFilters,

                     success: (oData, oResponse) => {
                        // "this" correctly references your controller
                        if(oData.results.length>0){
                            this.dlgAddOnAdd = oCore.byId("dlgAddOnAdd");

                        if (!this.dlgAddOnAdd) {
                            this.dlgAddOnAdd = sap.ui.xmlfragment("cus.sd.zsalesorder.create.view.AddOnsAdd", this);
                        };
                        var addOnLines = new sap.ui.model.json.JSONModel;
                        var aAddons = JSON.parse(oData.results[0].addons || "[]");
                        var sMainArtnr = oData.results[0].articleNumber;
 
                                        aAddons = aAddons.map(function(oItem) {
                                        return {
                                        ...oItem,
                                        mainArtnr: sMainArtnr
                                        };
                                        });
                        addOnLines.setData({"aAddons":aAddons});
                        this.dlgAddOnAdd.setMultiSelect(true);
                        this.getView().addDependent(this.dlgAddOnAdd);
                        this.dlgAddOnAdd.setModel(addOnLines,"addon");
                        jQuery.sap.syncStyleClass("sapUiSizeCompact", oThis.getView(), oThis.dlgAddOnAdd);
                        this.dlgAddOnAdd.open();
                        }
                        
                         
                    },
                    error: (oError) => {
                       sap.m.MessageToast.show("Error in reading ArticleList...");
                    }
                 });

            // var shopCart = oCore.getModel("shopCart");
            // var oAddons = oCore.getModel("oAddons");

            // var oTable = oView.byId("idProductsTable");

            // oTable.setModel(shopCart);

            // var items = oTable.getItems();
            // var lineItems = shopCart.getProperty("/lineitems");
            // var idx = oEvent.getSource().data("item");
            // var addOnLines = new sap.ui.model.json.JSONModel;
            // var mainArt;
            // var addAddOnList;

            // for (var i = 0; i < lineItems.length; i++) {

            //     if (idx == lineItems[i].itemLine) {
            //         mainArt = lineItems[i].artnumber;

            //         try {
            //             addAddOnList = oAddons.getProperty("/" + mainArt);
            //             addOnLines.setProperty("/", addAddOnList);

            //         } catch (e) {
            //             // TODO: handle exception
            //         };

            //     };

            // };








            
           

        },

        handleCloseAddon: function (oEvent) {

			//this.dlgAddOnAdd.close();
			//return;
			debugger;

            var oCore = sap.ui.getCore();
            var oThis = this;
            var oView = oThis.getView();

            var shopCart = oView.getModel("soc_cart");
            var lineItems = shopCart.getProperty("/oShoppingCartItems")
            var qtaLineUpd = [];
            var itemLine;

            var oAddons;

            if (lineItems) {

                for (var i = 0; i < lineItems.length; i++) {
                    itemLine = lineItems[i].itemLine;
                };

                itemLine = itemLine + 1;

            } else {
                itemLine = 1;
            };


            var aContexts = oEvent.getParameter("selectedContexts");
            if (aContexts && aContexts.length) {

                var oAddArts = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });


                for (var i = 0; i < oAddArts.length; i++) {

                    for (var ili = 0; ili < lineItems.length; ili++) {

                        if (oAddArts[i].mainArtnr == lineItems[ili].ProductID) {

                            var qtyEnable;
                            var addonQty;
                            var addonPrice;

                            if (parseInt(lineItems[ili].qty) > 1) {
                                qtyEnable = true
                                addonQty = lineItems[ili].qty;

                                addonPrice = (parseFloat(oAddArts[i].Price) * parseInt(addonQty)).toFixed(2)

                            } else {
                                qtyEnable = false
                                addonQty = 1;
                                addonPrice = parseFloat(oAddArts[i].price);
                            }

                            var aItemCategory;
                           // var productType = sap.ui.getCore().getModel('oQuickApp').getProperty('/productType');

                            //aItemCategory = oThis._getItemCategory(oAddArts[i].artNr, lineItems[ili].site, productType);

                            // Added by Terry on 2025/07/16
                            //var defaultCat = aItemCategory.length > 0 ? aItemCategory[2].pstyv : "";    // take the third element's key

                            qtaLineUpd.push({
                                itemLine: itemLine,
                                ProductID: oAddArts[i].mainArtnr,
                                description: oAddArts[i].desc,
                                addOnArt: oAddArts[i].artNr,
                                mainArtPrice: parseFloat(lineItems[ili].NetPrice).toFixed(0), // lineItems[ili].nettprice,
                                ProductDesc: oAddArts[i].desc,
                                UnitofMeasureTxt:lineItems[ili].UOM,
                                qty: addonQty,
                                qtyEnabled: qtyEnable,
                                delsite: lineItems[ili].delsite,
                                site: lineItems[ili].site,
                                unitprice: parseFloat(oAddArts[i].price), // oAddArts[i].price,
                                salesPerson: lineItems[ili].salesPerson,
                                //itemCategories: aItemCategory,
                                // itemCatagory: lineItems[ili].ItemCatagory,//commented out by Terry on 2025/07/16
                                //itemCatagory: defaultCat, // Added by Terry on 2025/07/16
                                nettprice: addonPrice,
                                origNettPrice: addonPrice,
                                overRideCond: lineItems[ili].overRideCond,
                                overRideEnabled: false,
                                tvLicReq: "N",
                                serialized: "N",
                                addOnEnabled: false,
                                linkMainArt: true,
                                egp: "Y",
                                tvlic: "N",
                                addOnFlg:"Y"

                            });

                        }; // if (oAddArts[i].mainArtnr ==
                        // lineItems[ili].artnumber) {

                    }; // for (var ili = 0; ili < lineItems.length; ili++) {

                }; // for (var i = 0; i < oAddArts.length; i++) {

                var lineItemsPls = {};

                for (var int = 0; int < qtaLineUpd.length; int++) {

                    shopCart.getProperty("/oShoppingCartItems").push(qtaLineUpd[int]);

                };


                shopCart.refresh();
                var oTable = oView.byId("SOC_CART_LIST");
                oTable.setModel(shopCart);

                oCore.setModel(shopCart, "soc_cart");
                oView.setModel(shopCart, "soc_cart");

            }; // if (aContexts && aContexts.length) {

           // oThis.calcProductValue();

        },
		calcProductValue: function (oEvent) {

            var oCore = sap.ui.getCore();
            var oThis = this;
            var oView = oThis.getView();

            var shopCart = sap.ui.getCore().getModel("soc_cart");
            var cartItems = shopCart.getProperty("/oShoppingCartItems");

            var txtPrdOverView = oView.byId("txtPrdOverView");
            var totProdValue = oView.byId("totProdValue");


            var rValue = 0;
            var itemCount = 0;

            for (var i = 0; i < cartItems.length; i++) {
                rValue = parseFloat(rValue) + parseFloat(cartItems[i].nettprice);
                itemCount = i;
            };


            txtPrdOverView.setText("Items: " + itemCount);
            totProdValue.setText("Total Product Value R" + rValue);


        },
		// custom code ends
	

});