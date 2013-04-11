var HistoryPanel=Backbone.View.extend(LoggableMixin).extend({el:"body.historyPage",HDAView:HDAEditView,events:{"click #history-tag":"loadAndDisplayTags","click #message-container":"removeMessage"},initialize:function(a){if(a.logger){this.logger=this.model.logger=a.logger}this.log(this+".initialize:",a);if(!a.urlTemplates){throw (this+" needs urlTemplates on initialize")}if(!a.urlTemplates.history){throw (this+" needs urlTemplates.history on initialize")}if(!a.urlTemplates.hda){throw (this+" needs urlTemplates.hda on initialize")}this.urlTemplates=a.urlTemplates.history;this.hdaUrlTemplates=a.urlTemplates.hda;this._setUpWebStorage(a.initiallyExpanded,a.show_deleted,a.show_hidden);this._setUpEventHandlers();this.hdaViews={};this.urls={}},_setUpEventHandlers:function(){this.model.bind("change:nice_size",this.updateHistoryDiskSize,this);this.model.bind("error",function(d,c,b,a){this.displayMessage("error",d);this.model.attributes.error=undefined},this);this.model.hdas.bind("add",this.add,this);this.model.hdas.bind("reset",this.addAll,this);this.model.hdas.bind("change:deleted",this.handleHdaDeletionChange,this);this.model.hdas.bind("change:purged",function(a){this.model.fetch()},this);this.model.hdas.bind("state:ready",function(b,c,a){if((!b.get("visible"))&&(!this.storage.get("show_hidden"))){this.removeHdaView(b.get("id"))}},this);this.bind("error",function(d,c,b,a){this.displayMessage("error",d)});if(this.logger){this.bind("all",function(a){this.log(this+"",arguments)},this)}},_setUpWebStorage:function(b,a,c){this.storage=new PersistantStorage("HistoryView."+this.model.get("id"),{expandedHdas:{},show_deleted:false,show_hidden:false});this.log(this+" (prev) storage:",JSON.stringify(this.storage.get(),null,2));if(b){this.storage.set("exandedHdas",b)}if((a===true)||(a===false)){this.storage.set("show_deleted",a)}if((c===true)||(c===false)){this.storage.set("show_hidden",c)}this.show_deleted=this.storage.get("show_deleted");this.show_hidden=this.storage.get("show_hidden");this.log(this+" (init'd) storage:",this.storage.get())},add:function(a){this.render()},addAll:function(){this.render()},handleHdaDeletionChange:function(a){if(a.get("deleted")&&!this.storage.get("show_deleted")){this.removeHdaView(a.get("id"))}},removeHdaView:function(c,b){var a=this.hdaViews[c];if(!a){return}a.remove(b);delete this.hdaViews[c];if(_.isEmpty(this.hdaViews)){this.render()}},render:function(){var b=this,d=b.toString()+".set-up",c=$("<div/>"),a=this.model.toJSON(),e=(this.$el.children().size()===0);a.urls=this._renderUrls(a);c.append(HistoryPanel.templates.historyPanel(a));c.find(".tooltip").tooltip({placement:"bottom"});if(!this.model.hdas.length||!this.renderItems(c.find("#"+this.model.get("id")+"-datasets"))){c.find("#emptyHistoryMessage").show()}$(b).queue(d,function(f){b.$el.fadeOut("fast",function(){f()})});$(b).queue(d,function(f){b.$el.html("");b.$el.append(c.children());b.$el.fadeIn("fast",function(){f()})});$(b).queue(d,function(f){this.log(b+" rendered:",b.$el);b._setUpBehaviours();if(e){b.trigger("rendered:initial")}else{b.trigger("rendered")}f()});$(b).dequeue(d);return this},_renderUrls:function(a){var b=this;b.urls={};_.each(this.urlTemplates,function(d,c){b.urls[c]=_.template(d,a)});return b.urls},renderItems:function(b){this.hdaViews={};var a=this,c=this.model.hdas.getVisible(this.storage.get("show_deleted"),this.storage.get("show_hidden"));_.each(c,function(f){var e=f.get("id"),d=a.storage.get("expandedHdas").get(e);a.hdaViews[e]=new a.HDAView({model:f,expanded:d,urlTemplates:a.hdaUrlTemplates,logger:a.logger});a._setUpHdaListeners(a.hdaViews[e]);b.prepend(a.hdaViews[e].render().$el)});return c.length},_setUpHdaListeners:function(b){var a=this;b.bind("body-expanded",function(c){a.storage.get("expandedHdas").set(c,true)});b.bind("body-collapsed",function(c){a.storage.get("expandedHdas").deleteKey(c)});b.bind("error",function(f,e,c,d){a.displayMessage("error",f)})},_setUpBehaviours:function(){if(!(this.model.get("user")&&this.model.get("user").email)){return}var a=this.$("#history-annotation-area");this.$("#history-annotate").click(function(){if(a.is(":hidden")){a.slideDown("fast")}else{a.slideUp("fast")}return false});async_save_text("history-name-container","history-name",this.urls.rename,"new_name",18);async_save_text("history-annotation-container","history-annotation",this.urls.annotate,"new_annotation",18,true,4)},updateHistoryDiskSize:function(){this.$el.find("#history-size").text(this.model.get("nice_size"))},showQuotaMessage:function(){var a=this.$el.find("#quota-message-container");if(a.is(":hidden")){a.slideDown("fast")}},hideQuotaMessage:function(){var a=this.$el.find("#quota-message-container");if(!a.is(":hidden")){a.slideUp("fast")}},toggleShowDeleted:function(){this.storage.set("show_deleted",!this.storage.get("show_deleted"));this.render();return this.storage.get("show_deleted")},toggleShowHidden:function(){this.storage.set("show_hidden",!this.storage.get("show_hidden"));this.render();return this.storage.get("show_hidden")},collapseAllHdaBodies:function(){_.each(this.hdaViews,function(a){a.toggleBodyVisibility(null,false)});this.storage.set("expandedHdas",{})},loadAndDisplayTags:function(d){this.log(this+".loadAndDisplayTags",d);var b=this,e=this.$el.find("#history-tag-area"),c=e.find(".tag-elt");this.log("\t tagArea",e," tagElt",c);if(e.is(":hidden")){if(!jQuery.trim(c.html())){var a=this;$.ajax({url:a.urls.tag,error:function(h,g,f){b.log("Error loading tag area html",h,g,f);b.trigger("error",_l("Tagging failed"),h,g,f)},success:function(f){c.html(f);c.find(".tooltip").tooltip();e.slideDown("fast")}})}else{e.slideDown("fast")}}else{e.slideUp("fast")}return false},displayMessage:function(c,d){var b=this.$el.find("#message-container"),a=$("<div/>").addClass(c+"message").text(d);b.html(a)},removeMessage:function(){var a=this.$el.find("#message-container");a.html(null)},toString:function(){var a=this.model.get("name")||"";return"HistoryPanel("+a+")"}});HistoryPanel.templates={historyPanel:Handlebars.templates["template-history-historyPanel"]};