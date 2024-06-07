const apiEndpoint = 'https://api.openai.com/v1/images/generations';  // OpenAIの画像生成APIのエンドポイント


function generateImage(communityName, callback) {
    $.ajax({
        url: apiEndpoint,
        method: 'POST',
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        data: JSON.stringify({
            prompt: communityName,
            n: 1,
            size: "256x256"
        }),
        success: function(response) {
            const imageUrl = response.data[0].url; // APIのレスポンスに合わせて調整
            callback(imageUrl);
        },
        error: function(error) {
            console.error('Error generating image:', error);
            // エラーハンドリングとしてプレースホルダー画像を使用
            const placeholderUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(communityName)}`;
            callback(placeholderUrl);
        }
    });
}

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');
    if (uid) {
        // UIDを使用してユーザー情報を取得
        auth.onAuthStateChanged((user) => {
            if (user && user.uid === uid) {
                // Firestoreからユーザー情報を取得
                db.collection('users').doc(uid).get().then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        $('#user-info').text(`Welcome, ${userData.id} !`);
                        // ユーザーの参加しているコミュニティをロード
                        loadCommunities(uid);
                    } else {
                        console.error('No such document!');
                        window.location.href = 'index.html';
                    }
                }).catch((error) => {
                    console.error('Error getting document:', error);
                    window.location.href = 'index.html';
                });
            } else {
                // ユーザーがログインしていない場合、またはUIDが一致しない場合はログインページにリダイレクト
                window.location.href = 'index.html';
            }
        });
    } else {
        // UIDがない場合はログインページにリダイレクト
        window.location.href = 'index.html';
    }

    let currentPage = 1;
    const communitiesPerPage = 8;

    /**
     * loadCommunities
     * 指定されたUIDのユーザーが参加しているコミュニティをロードし、ページネーションの設定を行う
     */
    function loadCommunities(uid) {
        db.collection('users').doc(uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const joinedCommunities = userData.joinedCommunities || [];
                setupPagination(joinedCommunities);
                displayCommunities(joinedCommunities, currentPage);
            }
        }).catch((error) => {
            console.error('Error getting document:', error);
        });
    }

    /**
     * setupPagination
     * コミュニティのIDリストに基づいてページネーションを設定
     */
    function setupPagination(communityIds) {
        const totalPages = Math.ceil(communityIds.length / communitiesPerPage);
        updatePageInfo(totalPages);
        
        $('#prev-page').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayCommunities(communityIds, currentPage);
                updatePageInfo(totalPages);
            }
        });

        $('#next-page').on('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                displayCommunities(communityIds, currentPage);
                updatePageInfo(totalPages);
            }
        });
    }

    /**
     * displayCommunities
     * 指定されたページのコミュニティを表示する
     */
    function displayCommunities(communityIds, page) {
        const start = (page - 1) * communitiesPerPage;
        const end = start + communitiesPerPage;
        const communitySubset = communityIds.slice(start, end).filter(id => id);

        $('.communities').empty();
        communitySubset.forEach((communityId) => {
            db.collection('communities').doc(communityId).get().then((communityDoc) => {
                if (communityDoc.exists) {
                    const communityData = communityDoc.data();
                    const communityName = communityData.name;

                    // 画像生成APIを呼び出して画像URLを取得
                    generateImage(communityName, function(imageUrl) {
                        $('.communities').append(`
                            <div class="community-item">
                                <img src="${imageUrl}" alt="${communityName}" class="community-image">
                                <h3>${communityName}</h3>
                            </div>
                        `);
                    });
                }
            }).catch((error) => {
                console.error('Error getting community document:', error);
            });
        });
    }

    /**
     * updatePageInfo
     * ページ情報を更新し、ページネーションボタンの状態を設定する
     */
    function updatePageInfo(totalPages) {
        $('#page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('#prev-page').prop('disabled', currentPage === 1);
        $('#next-page').prop('disabled', currentPage === totalPages);
    }

    /**
     * #create-community-buttonのクリックイベント
     * 現在のユーザーのUIDを含むURLでcommunity.htmlに遷移する
     */
    $('#create-community-button').on('click', function() {
        const uid = auth.currentUser.uid;
        window.location.href = `community.html?uid=${uid}`;
    });
});
