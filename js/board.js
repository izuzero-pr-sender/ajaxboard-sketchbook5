/**
 * AJAXBoard XE Module Javascript
 * Copyright (C) 아약스보드. All rights reserved.
 **/

(function($)
{
	AJAXBoardDocPlugin = xe.createPlugin("AJAXBoardDocPlugin",
	{
		init: function(parent)
		{
			parent.registerPlugin(this);
			
			var triggers = [
				[ "clearCommentEditor",      "after",  this.triggerClearCommentEditor ],
				[ "events.connect",          "after",  this.triggerConnect            ],
				[ "events.documentVoteUp",   "before", this.triggerDocumentVoteUp     ],
				[ "events.documentVoteDown", "before", this.triggerDocumentVoteDown   ],
				[ "events.insertComment",    "before", this.triggerInsertComment      ],
				[ "events.deleteComment",    "before", this.triggerDeleteComment      ],
				[ "events.commentVoteUp",    "before", this.triggerCommentVoteUp      ],
				[ "events.commentVoteDown",  "before", this.triggerCommentVoteDown    ],
				[ "events.insertDocument",   "before", this.triggerDispDocumentList   ],
				[ "events.deleteDocument",   "before", this.triggerDispDocumentList   ],
				[ "events.documentVoteUp",   "before", this.triggerDispDocumentList   ],
				[ "events.documentVoteDown", "before", this.triggerDispDocumentList   ],
				[ "events.insertComment",    "before", this.triggerDispDocumentList   ],
				[ "events.deleteComment",    "before", this.triggerDispDocumentList   ],
				[ "events.commentVoteUp",    "before", this.triggerDispDocumentList   ],
				[ "events.commentVoteDown",  "before", this.triggerDispDocumentList   ]
			];
			
			for (var i in triggers)
			{
				parent.insertTrigger(triggers[i][0], triggers[i][1], triggers[i][2]);
			}
		},
		triggerClearCommentEditor: function()
		{
			$("div.simple_wrt textarea[id^='editor_']").val("");
		},
		triggerConnect: function()
		{
			var that = this;
			
			if (typeof reComment == "function")
			{
				originReComment = reComment;
				
				reComment = function(doc_srl, cmt_srl, edit_url)
				{
					that.recomment = true;
					originReComment(doc_srl, cmt_srl, edit_url);
				}
			}
			if (typeof doCallModuleAction == "function")
			{
				doCallOriginModuleAction = doCallModuleAction;
				
				doCallModuleAction = function(module, action, target_srl)
				{
					var isAction = ["procDocumentVoteUp", "procDocumentVoteDown", "procDocumentDeclare", "procCommentVoteUp", "procCommentVoteDown", "procCommentDeclare"];
					
					for (var i in isAction)
					{
						if (action == isAction[i])
						{
							var params = {
								target_srl : target_srl,
								cur_mid    : current_mid,
								mid        : current_mid
							};
							return exec_xml(module, action, params);
						}
					}
					if ($.isFunction(doCallOriginModuleAction))
					{
						doCallOriginModuleAction(module, action, target_srl);
					}
				}
			}
			if (typeof completeInsertComment == "function")
			{
				completeInsertComment = function(obj)
				{
					that.clearCommentEditor();
					that.scrollToComment(2, that.animatetime || 1, "#comment_" + obj.comment_srl);
				}
			}
			if (typeof completeDeleteComment == "function")
			{
				completeDeleteComment = function(obj)
				{
				}
			}
			$("div#cmtPosition").on("click", "div.fdb_nav [href]", function(e)
			{
				var $this = $(this);
				var url = $this.attr("href");
				if (url.indexOf("#") > -1)
				{
					url = url.substring(0, url.indexOf("#"));
				}
				
				var act = url.getQuery("act");
				var comment_srl = url.getQuery("comment_srl");
				if (comment_srl && act == "dispBoardDeleteComment")
				{
					oAJAXBoard.deleteComment(url, comment_srl);
					return false;
				}
			})
			.on("click", "div.bd_pg [href], div.cmt_pg [href]", function(e)
			{
				var $this = $(this);
				var url = $this.attr("href");
				if (url.indexOf("#") > -1)
				{
					url = url.substring(0, url.indexOf("#"));
				}
				
				var cpage = url.getQuery("cpage");
				oAJAXBoardDocPlugin.dispCommentsByCpage(cpage > 1 && $this.hasClass("direction") ? "" : cpage);
				return false;
			});
			$("div#re_cmt a.close").on("click", this, function(e)
			{
				$("div#re_cmt").hide();
				oAJAXBoard.recomment = false;
				oAJAXBoardDocPlugin.dispComment();
			});
			$("div#re_cmt input[type=submit]").on("click", this, function(e)
			{
				$("div#re_cmt").hide();
				oAJAXBoard.recomment = false;
			});
			$("div.bd_lst_wrp").on("click", "div.bd_pg [href]", function()
			{
				var $this = $(this);
				var url = $this.attr("href");
				if (url.indexOf("#") > -1)
				{
					url = url.substring(0, url.indexOf("#"));
				}
				
				oAJAXBoardDocPlugin.dispDocumentListByPage(url.getQuery("page"));
				return false;
			});
		},
		triggerDocumentVoteUp: function(document_srl, count)
		{
			if (this.document_srl == document_srl)
			{
				$("div.rd_vote").children().eq(0).children().eq(0).html("♥ " + count);
				$("div.addon_addvote button.btn_voted span.num").html(count);
			}
		},
		triggerDocumentVoteDown: function(document_srl, count)
		{
			if (this.document_srl == document_srl)
			{
				$("div.rd_vote").children().eq(1).children().eq(0).html("♥ " + count);
				$("div.addon_addvote button.btn_blamed span.num").html(count);
			}
		},
		triggerInsertComment: function(document_srl, comment_srl)
		{
			if (!($("div#comment").length && this.document_srl == document_srl))
			{
				oAJAXBoardDocPlugin.dispComment();
			}
		},
		triggerDeleteComment: function(comment_srl)
		{
			if (!($("div#comment").length && $("#comment_" + comment_srl).length))
			{
				oAJAXBoardDocPlugin.dispComment();
			}
		},
		triggerCommentVoteUp: function(document_srl, comment_srl, count)
		{
			if (!this.recomment && $("#comment_" + comment_srl).length)
			{
				this.recomment = false;
				oAJAXBoardDocPlugin.dispComment();
			}
		},
		triggerCommentVoteDown: function(document_srl, comment_srl, count)
		{
			if (!this.recomment && $("#comment_" + comment_srl).length)
			{
				this.recomment = false;
				oAJAXBoardDocPlugin.dispComment();
			}
		},
		triggerDispDocumentList: function()
		{
			oAJAXBoardDocPlugin.dispDocumentList();
		},
		dispComment: function(args)
		{
			var that = this, $body = $("div#cmtPosition");
			
			if (!$body.length)
			{
				return false;
			}
			if (this.oApp.recomment)
			{
				if (!$("a.cmt_alert").length)
				{
					$("ul.fdb_lst_ul").append($('<a class="cmt_alert message info" onclick="jQuery(\'div#re_cmt a.close\').trigger(\'click\')">새로운 댓글이 있습니다. 클릭하면 새로운 댓글을 불러옵니다.</a>'));
				}
				return false;
			}
			else
			{
				this.oApp.startAjax();
				
				var ajax = this.oApp.getPagesHandler(args);
				
				ajax.done(function(response, status, xhr)
				{
					response = $("<div>").append($.parseHTML(response)).find("div#cmtPosition");
					
					$("a.cmt_alert").remove();
					$("div#re_cmt").appendTo($("div.cmt_editor"));
					$("div#cmtPosition").html(response.html());
				})
				.fail(function(xhr, status, error)
				{
					try {console.error("%s: %s, %o", status, error, xhr)}
					catch(e) {}
				})
				.always(function()
				{
					that.oApp.stopAjax();
				});
			}
			
			return ajax;
		},
		dispCommentsByCpage: function(cpage)
		{
			var that = this;
			
			return this.dispComment({cpage: cpage}).done(function(response, status, xhr)
			{
				that.oApp.current_url = that.oApp.current_url.setQuery("cpage", cpage);
				that.oApp.scrollToComment(1, that.oApp.animatetime || 1, "div#cmtPosition");
			});
		},
		dispDocumentList: function(args)
		{
			var $body = $("div.bd_lst_wrp");
			if (!$body.length)
			{
				return false;
			}
			
			this.oApp.startAjax();
			
			var that = this;
			var ajax = this.oApp.getPagesHandler();
			
			ajax.done(function(response, status, xhr)
			{
				response = $("<div>").append($.parseHTML(response)).find("div.bd_lst_wrp");
				$body = $("div.bd_lst_wrp");
				$body.children("table.bd_lst").html(response.children("table.bd_lst").html());
				$body.children("form.bd_pg").html(response.children("form.bd_pg").html());
			})
			.fail(function(xhr, status, error)
			{
				try {console.error("%s: %s, %o", status, error, xhr)}
				catch(e) {}
			})
			.always(function()
			{
				that.oApp.stopAjax();
			});
			
			return ajax;
		},
		dispDocumentListByPage: function(page)
		{
			var that = this;
			
			return this.dispDocumentList({page: page}).done(function(response, status, xhr)
			{
				that.oApp.current_url = that.oApp.current_url.setQuery("page", page);
			});
		}
	});
})(jQuery);

jQuery(function($)
{
	oAJAXBoardDocPlugin = new AJAXBoardDocPlugin(oAJAXBoard);
});