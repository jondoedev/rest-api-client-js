/* Creating the Post entity
 * ########################################################################################### */
function Post(id, title, content, author, unix_created_at) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.author = author;
    this.date = unix_created_at;
}

/*End Post Entity code
 * ###########################################################################################  */


/* Creating Post Collection
 * ########################################################################################### */
function PostCollection() {
    this.posts = [];
}

PostCollection.prototype.getAllPosts = function () {
    return this.posts;
};

PostCollection.prototype.setPosts = function (postsList) {
    var length = postsList.length;
    for (var i = 0; i < length; i++) {
        var post = new Post(postsList[i].id, postsList[i].title, postsList[i].content, postsList[i].author, postsList[i].unix_created_at);
        this.posts.push(post);
    }
    viewController.setTablePosts();
};

PostCollection.prototype.addPost = function (data) {
    var post = new Post(data.id, data.title, data.content, data.author);
    this.posts.push(post);
    viewController.addRow(post);
};

PostCollection.prototype.clearPosts = function () {
    this.posts = [];
};

PostCollection.prototype.getPostById = function (id) {
    return $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
};

PostCollection.prototype.updatePost = function (id, data) {
    var post = $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
    post.title = data.title;
    post.content = data.content;
    post.author = data.author;
};

PostCollection.prototype.deletePost = function (id) {
    this.posts = $.grep(this.posts, function (post) {
        return post.id != id;
    });
};
/* End PostCollection Code
 * ########################################################################################### */


/* PostController Code
 * ########################################################################################### */
function PostController() {

    this.getPosts = function () {
        $.ajax({
            url: BASE_API_URL + '?limit=' + limit,
            type: 'GET',
            success: function (result) {
                postCollection.setPosts(result);
            },
            error: function (xhr, resp, text) {
                $('.btnMore').html('Thats All').prop("disabled", true);
            }
        })
    };


    this.addPost = function (data) {
        $.ajax({
            url: BASE_API_URL + '/create',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (data) {
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
                postCollection.clearPosts();
                postController.getPosts();
                setTimeout(function () {
                    Helper.postTotalChecker();
                }, 500);
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.updatePost = function (id, data) {
        $.ajax({
            url: BASE_API_URL + '/edit/' + id,
            type: 'PUT',
            dataType: "JSON",
            data: JSON.stringify(data),
            success: function () {
                postCollection.updatePost(id, data);
                var $tr = $("tr[data-id='" + id + "']");
                $tr.children('td').eq(1).html(data.title);
                $tr.children('td').eq(2).html(data.content);
                $tr.children('td').eq(3).html(data.author);
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.deletePost = function (id) {
        var html_tr = "tr[data-id='" + id + "']";
        $.ajax({
            url: BASE_API_URL + '/delete/' + id,
            type: 'DELETE',
            dataType: 'json',
            success: function () {
                postCollection.deletePost(id);
                $(html_tr).fadeOut(400, function () {
                    $(html_tr).remove();
                })
            },
            error: function () {
                alert('Deleting of post #' + id + ' failed');
            }
        });
    }
}

/* End PostController Code
 * ########################################################################################### */


/* Event Listeners
 * ########################################################################################### */

$('#postForm').on('submit', function (event) {
    event.preventDefault();
    var id = parseInt($(this).data('id'));
    if (id === 0) {
        postController.addPost($(this).formSerialize());
    } else {
        postController.updatePost(id, $(this).formSerialize());
        $(this).data('id', 0);
    }
});

//delete event listener
$(document).on('click', '.delBtn', function () {
    var id = $(this).closest("tr").data('id');
    postController.deletePost(id);
    setTimeout(function () {
        Helper.postTotalChecker();
    }, 500);
});

//edit event listener
$(document).on('click', '.editBtn', function () {
    var id = $(this).closest("tr").data('id');
    var post = postCollection.getPostById(id);
    $('#title').val(post.title);
    $('#content').val(post.content);
    $('#author').val(post.author);
    $('#postForm').data('id', id);
    $('#postFormModal').modal('show');
});


//lazy load event listener
$('.btnMore').on('click', function () {
    Helper.lazyLoad();
});

//generate data via PHP Faker
$('.btnGenerate').on('click', function () {
    Helper.generatePosts();
});

//Sort ASC event listener
$('.glyphicon-sort-by-attributes').on('click', function () {
    var column = $(this).closest('th').data('sort');
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    $('.btnMore').html('More span').hide();
    $('.btnMoreSorted').html('More <span class="glyphicon glyphicon-download"></span>').removeClass('hidden');
    $('.btnMoreSorted').on('click', function () {
        Helper.postTotalChecker();
        limit += 5;
        Helper.sortASC(column);
    });
    Helper.sortASC(column);
});

//Sort DESC event listener
$('.glyphicon-sort-by-attributes-alt').on('click', function () {
    var column = $(this).closest('th').data('sort');
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    $('.btnMore').html('More').hide();
    $('.btnMoreSorted').html('More <span class="glyphicon glyphicon-download"></span>').removeClass('hidden');
    $('.btnMoreSorted').on('click', function () {
        Helper.postTotalChecker();
        limit += 5;
        Helper.sortDESC(column);
    });
    Helper.sortDESC(column);
});
/* End Event Listeners
 * ########################################################################################### */


/* ViewController Code
 * ########################################################################################### */
function ViewController() {
    this.setTablePosts = function () {
        var posts = postCollection.getAllPosts();
        var length = posts.length;
        rowCount = length;
        $('#postsTable tbody').empty();
        for (var i = 0; i < length; i++) {
            $('#postsTable tbody').append(
                '<tr data-id=' + posts[i].id + '>' +
                '<td class="date">' + Helper.timeDiff(posts[i].date) + '</td>' +
                '<td>' + posts[i].title + '</td>' +
                '<td>' + posts[i].content + '</td>' +
                '<td>' + posts[i].author + '</td>' +
                '<td class="text-center cell-option">' +

                //button for edit action
                '<button class="btn btn-info btn-xs editBtn ">' +
                '<span class="glyphicon glyphicon-edit"></span></button>' +

                // button for delete action
                '<button class="btn btn-danger btn-xs delBtn ">' +
                '<span class="glyphicon glyphicon-remove-sign">' +
                '</span></button></td></tr>'
            );
        }
    };
}

/* End ViewController Code
 * ########################################################################################### */


/* Helpers Code
 * ########################################################################################### */
function Helper() {
    this.formSerialize = function ($) {
        $.fn.formSerialize = function () {
            var serialized = {};
            var array = this.serializeArray();
            $.each(array, function () {
                if (serialized[this.name]) {
                    if (!serialized[this.name].push) {
                        serialized[this.name] = [serialized[this.name]];
                    }
                    serialized[this.name].push(this.value || '');
                } else {
                    serialized[this.name] = this.value || '';
                }
            });
            return serialized;
        };
    }(jQuery);

    this.generatePosts = function () {
        $.ajax({
            url: FAKER_URL,
            type: 'GET',
            success: function () {
                postCollection.clearPosts();
                postController.getPosts();
                alert('20 new data items was generated via Faker!')
            },
            error: function () {
                alert('an error occurred while generating data')
            }
        })
    };

    /*
        As first step it will Check actual postTotal count,
        and then checking values and adding more posts to a page
     */
    this.lazyLoad = function () {
        $('.glyphicon').removeClass("glyphicon-active");
        Helper.postTotalChecker();
        setTimeout(function () {
            if (limit >= postTotal) {
                limit = postTotal
                console.log('lazyTOtal', postTotal);
            } else {
                limit += 5;
            }
            postCollection.clearPosts();
            postController.getPosts();

            if (rowCount >= postTotal) {
                $('.btnMore').html('Thats All').prop("disabled", true);
                var interval = setInterval(function () {
                    Helper.currentTotalChecker(interval);
                }, 2500);
            }
        }, 250);

    };

    /*returns difference between current date
        and post creation date */
    this.timeDiff = function (date) {
        return moment().from(date * 1000)
    };


    this.sortASC = function (column) {
        postCollection.clearPosts();
        $.ajax({
            url: BASE_API_URL + '?column=' + column + '&option=ASC&limit=' + limit,
            type: 'GET',
            success: function (result) {
                postCollection.setPosts(result);
            }
        });
        if (rowCount >= postTotal) {
            $('.btnMoreSorted').html('Thats All').prop("disabled", true);
            var interval = setInterval(function () {
                Helper.currentTotalChecker(interval);
            }, 2500);
        }
    };

    this.sortDESC = function (column) {
        postCollection.clearPosts();
        $.ajax({
            url: BASE_API_URL + '?column=' + column + '&option=DESC&limit=' + limit,
            type: 'GET',
            success: function (result) {
                postCollection.setPosts(result);
            }
        });
        if (rowCount >= postTotal) {
            $('.btnMoreSorted').html('Thats All').prop("disabled", true);
            //
        }
    };
    //check difference between dates with interval
    this.dateChecker = function () {
        setInterval(function () {
            $('.date').each(function () {
                var id = $(this).parent('tr').data('id');
                var post = postCollection.getPostById(id);
                $(this).html(Helper.timeDiff(post.date));
            })
        }, 5000);
    };

    //get count of all posts from db
    this.postTotalChecker = function () {
        $.ajax({
            url: 'http://dcodeit.net/dmitry.kalenyuk/projects/rest-api-codeit/public/total',
            method: 'GET',
            datatype: 'json',
            success: function (data) {
                var result = data.total;
                postTotal = result;
            }
        });
    };

    this.currentTotalChecker = function (interval) {
        Helper.postTotalChecker();
        if (rowCount < postTotal) {
            $('.btnMoreSorted').html('More <span class="glyphicon glyphicon-download').prop("disabled", false);
            $('.btnMore').html('More <span class="glyphicon glyphicon-download').prop("disabled", false);
            clearInterval(interval);
        }
        console.log('total count of posts in db', postTotal);
        console.log('post shown', rowCount);
    };
}

/* End Helpers Code
 * ########################################################################################### */


var postController = new PostController();
var postCollection = new PostCollection();
var viewController = new ViewController();
var Helper = new Helper();
var rowCount;
var postTotal;

var limit = 10;
const BASE_API_URL = 'http://dcodeit.net/dmitry.kalenyuk/projects/rest-api-codeit/public/posts';
const FAKER_URL = 'http://dcodeit.net/dmitry.kalenyuk/practice/faker/';
postController.getPosts();
Helper.dateChecker();
// Helper.postTotalChecker();


