from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
from model import (
    Users, Students, Grades, Chatrooms, ChatroomMembers, Messages,
    Groups, GroupMembers, Targets, Remarks, Notifications,
    PrivateMessages, Assignments, student_grading
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

   # Define absolute path for SQLite database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'grade_manager.db')

def init_db():
    """Initialize database tables."""
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            bio TEXT,
            profile_photo TEXT
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            teacher_id TEXT,
            profile_photo TEXT
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS grades (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            subject TEXT,
            score INTEGER,
            grade TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS chatrooms (
            id TEXT PRIMARY KEY,
            name TEXT,
            teacher_id TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS chatroom_members (
            chatroom_id TEXT,
            user_id TEXT,
            PRIMARY KEY (chatroom_id, user_id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chatroom_id TEXT,
            user_id TEXT,
            content TEXT,
            type TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT,
            teacher_id TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS group_members (
            group_id TEXT,
            user_id TEXT,
            PRIMARY KEY (group_id, user_id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS targets (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            subject TEXT,
            target INTEGER,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS remarks (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            teacher_id TEXT,
            content TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP,
            is_read INTEGER DEFAULT 0
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS private_messages (
            id TEXT PRIMARY KEY,
            sender_id TEXT,
            receiver_id TEXT,
            content TEXT,
            type TEXT,
            created_at TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            student_id TEXT,
            teacher_id TEXT,
            title TEXT,
            file_path TEXT,
            status TEXT,
            created_at TIMESTAMP
        )''')
        conn.commit()

def notify_user(user_id, content):
    """Send a notification to a user via SocketIO and store it."""
    Notifications.create(user_id, content)
    socketio.emit('notification', {'user_id': user_id, 'content': content, 'created_at': str(datetime.now())}, namespace='/')

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    teacher_id = data.get('teacher_id') if role == 'student' else None

    if not all([name, email, password, role]):
        return jsonify({'message': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    try:
        user_id = Users.create(name, email, hashed_password, role, bio='', profile_photo=None)
        if role == 'student':
            Students.create(user_id, name, email, teacher_id, profile_photo=None)
        notify_user(user_id, f"Welcome {name} to Grade Manager!")
        return jsonify({
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': role,
                'teacher_id': teacher_id,
                'bio': '',
                'profile_photo': None
            }
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Email already exists'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    user = Users.get_by_email(email)
    if user and check_password_hash(user['password'], password) and user['role'] == role:
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'bio': user['bio'],
            'profile_photo': user['profile_photo']
        }
        if role == 'student':
            student = Students.get_by_id(user['id'])
            user_data['teacher_id'] = student['teacher_id'] if student else None
        return jsonify({'user': user_data})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/profile/<id>', methods=['GET', 'PUT'])
def manage_profile(id):
    if request.method == 'GET':
        user = Users.get_by_id(id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'bio': user['bio'],
            'profile_photo': user['profile_photo']
        }
        if user['role'] == 'student':
            student = Students.get_by_id(id)
            user_data['teacher_id'] = student['teacher_id'] if student else None
        return jsonify(user_data)

    if request.method == 'PUT':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        bio = data.get('bio')
        password = data.get('password')

        if not name or not email:
            return jsonify({'message': 'Name and email cannot be empty'}), 400

        try:
            if password:
                hashed_password = generate_password_hash(password)
                Users.update(id, name=name, email=email, password=hashed_password, bio=bio)
            else:
                Users.update(id, name=name, email=email, bio=bio)
            if Students.get_by_id(id):
                Students.update(id, name=name, email=email)
            notify_user(id, "Your profile was updated")
            return jsonify({'message': 'Profile updated'})
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Email already exists'}), 400

@app.route('/api/profile/<id>/photo', methods=['POST'])
def upload_profile_photo(id):
    if 'photo' not in request.files:
        return jsonify({'message': 'No photo provided'}), 400
    photo = request.files['photo']
    if photo and photo.filename:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in photo.filename or photo.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'message': 'Invalid file type'}), 400
        filename = f"{id}_{uuid.uuid4().hex[:8]}.{photo.filename.rsplit('.', 1)[1].lower()}"
        upload_path = os.path.join('uploads', filename)
        try:
            photo.save(upload_path)
            Users.update(id, profile_photo=filename)
            if Students.get_by_id(id):
                Students.update(id, profile_photo=filename)
            notify_user(id, "Profile photo updated")
            return jsonify({'message': 'Photo uploaded', 'photo': filename})
        except Exception as e:
            return jsonify({'message': f'Upload failed: {str(e)}'}), 500
    return jsonify({'message': 'Invalid photo'}), 400

@app.route('/uploads/<filename>', methods=['GET'])
def serve_uploaded_file(filename):
    return send_from_directory('uploads', filename)

@app.route('/api/students', methods=['GET', 'POST'])
def manage_students():
    if request.method == 'GET':
        students = Students.get_all()
        result = []
        for student in students:
            grades = Grades.get_by_student(student['id'])
            total_score = sum(grade['score'] for grade in grades[:7])
            general_grade = student_grading(total_score / min(len(grades), 7)) if grades else 'E'
            result.append({
                'id': student['id'],
                'name': student['name'],
                'email': student['email'],
                'profile_photo': student['profile_photo'],
                'teacher_id': student['teacher_id'],
                'general_grade': general_grade
            })
        result.sort(key=lambda x: {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1}.get(x['general_grade'], 1), reverse=True)
        return jsonify(result)

    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        teacher_id = data.get('teacher_id')
        if not name or not email or not teacher_id:
            return jsonify({'message': 'Name, email, and teacher ID cannot be empty'}), 400
        try:
            student_id = Users.create(name, email, generate_password_hash('default123'), 'student')
            Students.create(student_id, name, email, teacher_id)
            notify_user(teacher_id, f"Added student {name}")
            notify_user(student_id, f"You were added to {name}'s class")
            return jsonify({'message': 'Student added'}), 201
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Email already exists'}), 400

@app.route('/api/students/<id>', methods=['GET', 'PUT', 'DELETE'])
def update_delete_student(id):
    if request.method == 'GET':
        student = Students.get_by_id(id)
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        grades = Grades.get_by_student(id)
        targets = Targets.get_by_student(id)
        remarks = Remarks.get_by_student(id)
        return jsonify({
            'student': {
                'id': student['id'],
                'name': student['name'],
                'email': student['email'],
                'profile_photo': student['profile_photo'],
                'teacher_id': student['teacher_id']
            },
            'grades': [{'id': g['id'], 'subject': g['subject'], 'score': g['score'], 'grade': g['grade'], 'created_at': g['created_at']} for g in grades],
            'targets': [{'id': t['id'], 'subject': t['subject'], 'target': t['target']} for t in targets],
            'remarks': [{'id': r['id'], 'content': r['content'], 'created_at': r['created_at']} for r in remarks]
        })

    if request.method == 'PUT':
        data = request.get_json()
        name = data.get('name')
        if not name:
            return jsonify({'message': 'Name cannot be empty'}), 400
        Students.update(id, name=name)
        Users.update(id, name=name)
        notify_user(id, f"Your name was updated to {name}")
        return jsonify({'message': 'Student updated'})

    if request.method == 'DELETE':
        student = Students.get_by_id(id)
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        Students.delete(id)
        Users.delete(id)
        notify_user(student['teacher_id'], f"Student {id} was removed")
        return jsonify({'message': 'Student deleted'})

@app.route('/api/students/<id>/trends', methods=['GET'])
def get_student_trends(id):
    grades = Grades.get_by_student(id)
    avg_score = sum(g['score'] for g in grades) / len(grades) if grades else 0
    subject_avgs = {}
    for g in grades:
        subject = g['subject']
        if subject not in subject_avgs:
            subject_avgs[subject] = {'total': 0, 'count': 0}
        subject_avgs[subject]['total'] += g['score']
        subject_avgs[subject]['count'] += 1
    subject_averages = [{'subject': k, 'avg_score': v['total'] / v['count']} for k, v in subject_avgs.items()]
    return jsonify({
        'grades': [{'subject': g['subject'], 'score': g['score'], 'created_at': g['created_at']} for g in grades],
        'average_score': avg_score,
        'subject_averages': subject_averages
    })

@app.route('/api/grades', methods=['GET', 'POST'])
def manage_grades():
    if request.method == 'GET':
        grades = Grades.get_all()
        return jsonify([{'id': g['id'], 'student_id': g['student_id'], 'subject': g['subject'], 'score': g['score'], 'grade': g['grade']} for g in grades])

    if request.method == 'POST':
        data = request.get_json()
        student_id = data.get('studentId')
        subject = data.get('subject')
        score = data.get('score')
        teacher_id = data.get('teacher_id')
        if not subject or not score:
            return jsonify({'message': 'Subject and score cannot be empty'}), 400
        grade = student_grading(score)
        if grade == "invalid":
            return jsonify({'message': 'Invalid score'}), 400
        grades = Grades.get_by_student(student_id)
        if len(grades) >= 8:
            return jsonify({'message': 'Maximum 8 subjects allowed'}), 400
        Grades.create(student_id, subject, score, grade)
        notify_user(student_id, f"New grade for {subject}: {grade}")
        notify_user(teacher_id, f"Added grade for {subject}")
        return jsonify({'message': 'Grade added'}), 201

@app.route('/api/assignments', methods=['GET', 'POST'])
def manage_assignments():
    if request.method == 'GET':
        teacher_id = request.args.get('teacher_id')
        student_id = request.args.get('student_id')
        if teacher_id:
            assignments = Assignments.get_by_user(teacher_id, role='teacher')
        elif student_id:
            assignments = Assignments.get_by_user(student_id, role='student')
        else:
            assignments = Assignments.get_all()
        return jsonify([{
            'id': a['id'],
            'student_id': a['student_id'],
            'title': a['title'],
            'file_path': a['file_path'],
            'status': a['status'],
            'created_at': a['created_at']
        } for a in assignments])

    if request.method == 'POST':
        if 'file' not in request.files or not request.form.get('title') or not request.form.get('student_id') or not request.form.get('teacher_id'):
            return jsonify({'message': 'Missing file, title, student ID, or teacher ID'}), 400
        file = request.files['file']
        title = request.form['title']
        student_id = request.form['student_id']
        teacher_id = request.form['teacher_id']
        allowed_extensions = {'pdf', 'doc', 'docx'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'message': 'Invalid file type'}), 400
        filename = f"assignment_{student_id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
        upload_path = os.path.join('uploads', filename)
        try:
            file.save(upload_path)
            Assignments.create(student_id, teacher_id, title, filename)
            notify_user(student_id, f"Assignment {title} submitted")
            notify_user(teacher_id, f"New assignment {title} from student {student_id}")
            return jsonify({'message': 'Assignment submitted', 'file_path': filename})
        except Exception as e:
            return jsonify({'message': f'Upload failed: {str(e)}'}), 500

@app.route('/api/assignments/<id>/status', methods=['PUT'])
def update_assignment_status(id):
    data = request.get_json()
    status = data.get('status')
    student_id = data.get('student_id')
    if not status or status not in ['Submitted', 'Reviewed', 'Graded']:
        return jsonify({'message': 'Invalid status'}), 400
    Assignments.update_status(id, status)
    notify_user(student_id, f"Assignment status updated to {status}")
    return jsonify({'message': 'Status updated'})

@app.route('/api/remarks', methods=['POST'])
def add_remark():
    data = request.get_json()
    student_id = data.get('studentId')
    teacher_id = data.get('teacherId')
    content = data.get('content')
    Remarks.create(student_id, teacher_id, content)
    notify_user(student_id, f"New remark: {content}")
    return jsonify({'message': 'Remark added'}), 201

@app.route('/api/chatrooms', methods=['GET', 'POST'])
def manage_chatrooms():
    if request.method == 'GET':
        chatrooms = Chatrooms.get_all()
        return jsonify([{'id': c['id'], 'name': c['name']} for c in chatrooms])

    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        teacher_id = data.get('teacher_id')
        chatroom_id = Chatrooms.create(name, teacher_id)
        notify_user(teacher_id, f"Created chatroom {name}")
        return jsonify({'message': 'Chatroom created', 'id': chatroom_id}), 201

@app.route('/api/chatrooms/<id>/invite', methods=['POST'])
def invite_to_chatroom(id):
    data = request.get_json()
    student_id = data.get('studentId')
    teacher_id = data.get('teacher_id')
    student = Students.get_by_id(student_id)
    if not student or student['teacher_id'] != teacher_id:
        return jsonify({'message': 'Student not in your class'}), 400
    ChatroomMembers.add(id, student_id)
    notify_user(student_id, f"Invited to chatroom")
    return jsonify({'message': 'Invitation sent'})

@app.route('/api/chatrooms/<id>/remove', methods=['POST'])
def remove_from_chatroom(id):
    data = request.get_json()
    student_id = data.get('studentId')
    ChatroomMembers.remove(id, student_id)
    notify_user(student_id, f"Removed from chatroom")
    return jsonify({'message': 'Student removed'})

@app.route('/api/chatrooms/<id>/messages', methods=['GET', 'POST'])
def manage_messages(id):
    if request.method == 'GET':
        messages = Messages.get_by_chatroom(id)
        members = ChatroomMembers.get_members(id)
        return jsonify({
            'messages': [{'id': m['id'], 'user_id': m['user_id'], 'content': m['content'], 'type': m['type'], 'created_at': m['created_at']} for m in messages],
            'members': members
        })

    if request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id')
        content = data.get('content')
        msg_type = data.get('type')
        Messages.create(id, user_id, content, msg_type)
        notify_user(user_id, f"New message in chatroom")
        return jsonify({'message': 'Message sent'}), 201

@app.route('/api/groups', methods=['GET', 'POST'])
def manage_groups():
    if request.method == 'GET':
        groups = Groups.get_all()
        return jsonify([{'id': g['id'], 'name': g['name']} for g in groups])

    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        teacher_id = data.get('teacher_id')
        group_id = Groups.create(name, teacher_id)
        notify_user(teacher_id, f"Created group {name}")
        return jsonify({'message': 'Group created', 'id': group_id}), 201

@app.route('/api/groups/<id>', methods=['GET', 'DELETE'])
def group_details(id):
    if request.method == 'GET':
        group = Groups.get_by_id(id)
        if not group:
            return jsonify({'message': 'Group not found'}), 404
        members = GroupMembers.get_members(id)
        return jsonify({'id': group['id'], 'name': group['name'], 'members': members})

    if request.method == 'DELETE':
        Groups.delete(id)
        notify_user(id, "Group deleted")
        return jsonify({'message': 'Group deleted'})

@app.route('/api/groups/<id>/members', methods=['POST', 'DELETE'])
def manage_group_members(id):
    if request.method == 'POST':
        data = request.get_json()
        student_id = data.get('studentId')
        teacher_id = data.get('teacher_id')
        student = Students.get_by_id(student_id)
        if not student or student['teacher_id'] != teacher_id:
            return jsonify({'message': 'Student not in your class'}), 400
        GroupMembers.add(id, student_id)
        notify_user(student_id, f"Added to group")
        return jsonify({'message': 'Member added'})

    if request.method == 'DELETE':
        data = request.get_json()
        student_id = data.get('studentId')
        GroupMembers.remove(id, student_id)
        notify_user(student_id, f"Removed from group")
        return jsonify({'message': 'Member removed'})

@app.route('/api/targets', methods=['POST'])
def set_target():
    data = request.get_json()
    student_id = data.get('studentId')
    subject = data.get('subject')
    target = data.get('target')
    if not subject or not target or not (0 <= int(target) <= 100):
        return jsonify({'message': 'Invalid subject or target (0-100)'}), 400
    Targets.create(student_id, subject, target)
    notify_user(student_id, f"Set target for {subject}: {target}")
    return jsonify({'message': 'Target set'}), 201

@app.route('/api/notifications/<user_id>', methods=['GET', 'PUT'])
def manage_notifications(user_id):
    if request.method == 'GET':
        notifications = Notifications.get_by_user(user_id)
        return jsonify([{'id': n['id'], 'content': n['content'], 'created_at': n['created_at'], 'is_read': n['is_read']} for n in notifications])

    if request.method == 'PUT':
        data = request.get_json()
        notification_id = data.get('notification_id')
        Notifications.mark_as_read(notification_id, user_id)
        return jsonify({'message': 'Notification marked as read'})

@app.route('/api/private_messages/<user_id>', methods=['GET', 'POST'])
def manage_private_messages(user_id):
    if request.method == 'GET':
        messages = PrivateMessages.get_by_user(user_id)
        return jsonify([{
            'id': m['id'],
            'sender_id': m['sender_id'],
            'receiver_id': m['receiver_id'],
            'content': m['content'],
            'type': m['type'],
            'created_at': m['created_at']
        } for m in messages])

    if request.method == 'POST':
        data = request.get_json()
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        content = data.get('content')
        msg_type = data.get('type')
        PrivateMessages.create(sender_id, receiver_id, content, msg_type)
        notify_user(receiver_id, f"New private message from user {sender_id}")
        return jsonify({'message': 'Message sent'}), 201

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    init_db()  # Initialize database on startup
    socketio.run(app, debug=True)